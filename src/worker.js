/**
 * Balga Designs — Cloudflare Worker (Static Assets).
 * Runs before assets (run_worker_first: true) to:
 *  - handle POST /api/contact (email via Resend if configured, else preview mode),
 *  - add security + caching headers,
 *  - add X-Robots-Tag: noindex, nofollow on a preview clone (PREVIEW_NOINDEX=true).
 */

import { handleCms, saveEnquiry, hasCmsSession, sendMail, mailConfigured, rateLimit, clientIp } from "./cms/handler.js";
// The one source of business facts, so error copy can't drift from the site.
import settings from "./data/content/settings.json";

// Everything except the script policy, which is built per page below.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "img-src 'self' data:",
  // Astro emits scoped <style> blocks and a handful of style attributes; style
  // injection is a cosmetic risk, unlike script injection, so this stays.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://maps.google.com https://www.google.com",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  // The site is HTTPS-only. includeSubDomains and preload are deliberately left
  // off until the production domain is live and its subdomains are confirmed —
  // both are hard to walk back once a browser has cached them.
  "Strict-Transport-Security": "max-age=31536000",
};

/**
 * The script policy for one page.
 *
 * Inline scripts (Astro's hoisted bundles, the JSON-LD the SEO work needs, the
 * admin app) are named by SHA-256 hash, computed at build time — so the browser
 * runs exactly those and refuses anything injected. Falls back to the old
 * 'unsafe-inline' only if the manifest can't be read at all: a weaker policy for
 * a moment beats a site whose scripts all stop running.
 */
let cspManifest; // undefined = not loaded yet, null = unavailable
async function scriptSrcFor(env, url, status) {
  if (cspManifest === undefined) {
    try {
      const res = await env.ASSETS.fetch(new URL("/_cms/csp.json", url.origin));
      cspManifest = res.ok ? await res.json() : null;
    } catch {
      cspManifest = null;
    }
  }
  if (!cspManifest) return "'self' 'unsafe-inline'";
  // A miss is normally the 404 page being served for an unknown path.
  const hashes = cspManifest[url.pathname] || (status === 404 ? cspManifest["/404.html"] : null);
  return ["'self'", ...(hashes || []).map((h) => `'${h}'`)].join(" ");
}

const cspWith = (scriptSrc) => [...CSP_DIRECTIVES, `script-src ${scriptSrc}`].join("; ");
/** For non-HTML responses, which never execute inline script. */
const STATIC_CSP = cspWith("'self'");

/**
 * Whether this deployment should tell crawlers to stay away. The live site is
 * findable, so only a preview clone opts in — with PREVIEW_NOINDEX="true", the
 * same polarity as the build-time PUBLIC_NOINDEX switch.
 */
const noindexing = (env) => (env.PREVIEW_NOINDEX ?? "false") === "true";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function handleContact(request, env) {
  if (request.method !== "POST") return json({ status: "error", message: "Method not allowed." }, 405);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ status: "error", message: "Invalid request." }, 400);
  }
  const firstName = (body.firstName || "").toString().trim();
  const lastName = (body.lastName || "").toString().trim();
  const email = (body.email || "").toString().trim();
  const message = (body.message || "").toString().trim();
  const honeypot = (body.company || "").toString().trim();

  // Honeypot: silently accept to waste bot effort.
  if (honeypot) return json({ status: "sent", message: "Thanks! Your message has been sent." });

  // A person sends one or two messages; a script sends hundreds. This keeps the
  // enquiry inbox — and, once mail is on, the sending quota — usable.
  const rl = await rateLimit(env, "contact", clientIp(request), { limit: 5, windowSeconds: 900 });
  if (rl.limited) {
    return json({
      status: "error",
      message: `Thanks — we've already got your message. If you need to send another, please wait a few minutes or email ${settings.email}.`,
    }, 429);
  }

  const errors = {};
  if (!firstName) errors.firstName = "Required";
  if (!lastName) errors.lastName = "Required";
  if (!isValidEmail(email)) errors.email = "Invalid email";
  if (!message) errors.message = "Required";
  if (Object.keys(errors).length) {
    return json({ status: "error", message: "Please check the highlighted fields.", errors }, 422);
  }

  // Store the enquiry first, so it reaches the CMS dashboard even if email delivery
  // isn't configured yet or Resend has a bad day. A storage failure must never lose
  // the client a lead, so it doesn't block the send below.
  const stored = await saveEnquiry(env, { firstName, lastName, email, message }).catch(() => ({ ok: false }));

  // Notify the business. Mail goes out through whichever route is configured —
  // their Google Workspace relay or Resend — see sendMail() in cms/handler.js.
  const to = env.CONTACT_TO_EMAIL || settings.email;

  if (!mailConfigured(env)) {
    // Nothing can be sent yet. Say so honestly; the enquiry is safe either way.
    return json({
      status: stored.ok ? "sent" : "preview",
      message: stored.ok
        ? `Thanks! Your message has been received — we’ll be in touch soon. For anything urgent, email ${settings.email}.`
        : `Preview mode: your message validated correctly, but email delivery isn’t configured on this deployment. Please email ${settings.email} directly.`,
    });
  }

  const sent = await sendMail(env, {
    to,
    subject: `New enquiry from ${firstName} ${lastName}`,
    text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\n${message}`,
    replyTo: email,
    fromName: "Balga Designs website",
  });

  if (!sent.ok) {
    // The enquiry is already saved, so this isn't lost — the client will see it on
    // the dashboard even though the notification didn't get through.
    return json({
      status: stored.ok ? "sent" : "error",
      message: stored.ok
        ? `Thanks! Your message has been received — we’ll be in touch soon.`
        : `We couldn’t send your message right now. Please email ${settings.email}.`,
      detail: sent.error ? String(sent.error).slice(0, 200) : undefined,
    }, stored.ok ? 200 : 502);
  }

  return json({ status: "sent", message: "Thanks! Your message has been sent — we’ll be in touch soon." });
}

// Content types wrangler's asset server may not set (needed alongside nosniff).
const CONTENT_TYPES = {
  ".xsl": "text/xsl; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function withHeaders(res, env, url) {
  const pathname = url.pathname;
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);

  const isHtml = (headers.get("Content-Type") || "").includes("text/html");
  headers.set("Content-Security-Policy", isHtml ? cspWith(await scriptSrcFor(env, url, res.status)) : STATIC_CSP);

  const ext = pathname.slice(pathname.lastIndexOf("."));
  if (CONTENT_TYPES[ext]) headers.set("Content-Type", CONTENT_TYPES[ext]);

  if (noindexing(env)) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  // Caching by asset type.
  if (/^\/(_astro|fonts)\//.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/^\/assets\//.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
  } else if (/\.(html)$/.test(pathname) || pathname.endsWith("/") || !/\.[a-z0-9]+$/i.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      const res = await handleContact(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      headers.set("Content-Security-Policy", STATIC_CSP);
      headers.set("Cache-Control", "no-store");
      if (noindexing(env)) headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    // Custom CMS backend (auth + GitHub commits). Admin UI is served as a static asset at /admin/.
    if (url.pathname.startsWith("/cms-api/")) {
      const res = await handleCms(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      headers.set("Content-Security-Policy", STATIC_CSP);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    // Signed-in-only paths:
    //  /_cms/*           build reports naming unpublished pages
    //  /cms-config.json  the CMS schema — no secrets, but it maps the repo layout
    //  /review/*         internal content & local-search planning doc
    // Everyone else gets the same 404 they'd get for any missing path.
    if (url.pathname.startsWith("/_cms/") || url.pathname === "/cms-config.json" || url.pathname.startsWith("/review")) {
      if (!(await hasCmsSession(request, env))) {
        const notFound = await env.ASSETS.fetch(new URL("/404.html", url.origin));
        return withHeaders(new Response(notFound.body, { status: 404, headers: notFound.headers }), env, url);
      }
      const res = await env.ASSETS.fetch(request);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      headers.set("Content-Security-Policy", STATIC_CSP);
      headers.set("Cache-Control", "no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    const assetRes = await env.ASSETS.fetch(request);
    return withHeaders(assetRes, env, url);
  },
};

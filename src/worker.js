/**
 * Balga Designs — Cloudflare Worker (Static Assets).
 * Runs before assets (run_worker_first: true) to:
 *  - handle POST /api/contact (email via Resend if configured, else preview mode),
 *  - add security + caching headers,
 *  - add X-Robots-Tag: noindex, nofollow on the preview (toggle with PREVIEW_NOINDEX=false).
 */

import { handleCms } from "./cms/handler.js";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://maps.google.com https://www.google.com",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; "),
};

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

  const errors = {};
  if (!firstName) errors.firstName = "Required";
  if (!lastName) errors.lastName = "Required";
  if (!isValidEmail(email)) errors.email = "Invalid email";
  if (!message) errors.message = "Required";
  if (Object.keys(errors).length) {
    return json({ status: "error", message: "Please check the highlighted fields.", errors }, 422);
  }

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL || "rao@jewellprojects.com";
  const from = env.CONTACT_FROM_EMAIL || "Balga Designs <onboarding@resend.dev>";

  // No delivery credentials configured -> honest preview response (never fake a send).
  if (!apiKey || !to || !from) {
    return json({
      status: "preview",
      message:
        "Preview mode: your message validated correctly, but email delivery isn’t configured on this preview deployment. Please email info@balgadesigns.com.au directly.",
    });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `New enquiry from ${firstName} ${lastName}`,
        text: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\n${message}`,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ status: "error", message: "We couldn’t send your message right now. Please email info@balgadesigns.com.au.", detail: detail.slice(0, 200) }, 502);
    }
    return json({ status: "sent", message: "Thanks! Your message has been sent — we’ll be in touch soon." });
  } catch {
    return json({ status: "error", message: "Network error sending your message. Please email info@balgadesigns.com.au." }, 502);
  }
}

// Content types wrangler's asset server may not set (needed alongside nosniff).
const CONTENT_TYPES = {
  ".xsl": "text/xsl; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function withHeaders(res, env, pathname) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);

  const ext = pathname.slice(pathname.lastIndexOf("."));
  if (CONTENT_TYPES[ext]) headers.set("Content-Type", CONTENT_TYPES[ext]);

  if ((env.PREVIEW_NOINDEX ?? "true") !== "false") {
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
      headers.set("Cache-Control", "no-store");
      if ((env.PREVIEW_NOINDEX ?? "true") !== "false") headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    // Custom CMS backend (auth + GitHub commits). Admin UI is served as a static asset at /admin/.
    if (url.pathname.startsWith("/cms-api/")) {
      const res = await handleCms(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(res.body, { status: res.status, headers });
    }

    const assetRes = await env.ASSETS.fetch(request);
    return withHeaders(assetRes, env, url.pathname);
  },
};

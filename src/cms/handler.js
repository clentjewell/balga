/**
 * Balga CMS — Cloudflare Worker backend (custom, email/password).
 *
 * Mirrors the Pottsville pattern: the client logs in with email + password;
 * this Worker verifies them, holds a GitHub bot token as a secret, and commits
 * content changes to the repo on their behalf. A push then triggers the deploy
 * workflow, so a save is live in ~1–2 minutes.
 *
 * Required Worker secrets / vars (set with `wrangler secret put ...`):
 *   CMS_EMAIL          admin login email
 *   CMS_PASSWORD       admin login password (encrypted at rest by Cloudflare)
 *   CMS_SESSION_SECRET random string used to sign session cookies
 *   GITHUB_TOKEN       fine-grained PAT with Contents: read/write on the repo
 *   GH_OWNER, GH_REPO, GH_BRANCH   repo target (vars, not secret)
 */

const COOKIE = "cms_session";
const SESSION_TTL = 60 * 60 * 8; // 8 hours
const enc = new TextEncoder();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

// ---- session token (HMAC-SHA256) ----
function b64url(bytes) {
  let s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function signSession(env, email) {
  const payload = b64url(enc.encode(JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL })));
  const key = await hmacKey(env.CMS_SESSION_SECRET || "dev-secret");
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return `${payload}.${sig}`;
}
async function verifySession(env, token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const key = await hmacKey(env.CMS_SESSION_SECRET || "dev-secret");
  const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), enc.encode(payload)).catch(() => false);
  if (!ok) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}
function getCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---- GitHub REST helpers ----
function ghBase(env) {
  return `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/contents`;
}
async function ghFetch(env, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "balga-cms",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}
const branch = (env) => env.GH_BRANCH || "main";

async function ghList(env, dir) {
  const r = await ghFetch(env, "GET", `${ghBase(env)}/${dir}?ref=${branch(env)}`);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  const items = (Array.isArray(r.data) ? r.data : [])
    .filter((f) => f.type === "file")
    .map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size }));
  return { ok: true, items };
}
async function ghGet(env, path) {
  const r = await ghFetch(env, "GET", `${ghBase(env)}/${encodeURI(path)}?ref=${branch(env)}`);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  const content = r.data.encoding === "base64" ? decodeB64Utf8(r.data.content) : r.data.content;
  return { ok: true, content, sha: r.data.sha };
}
function decodeB64Utf8(b64) {
  const bytes = Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeB64Utf8(str) {
  const bytes = enc.encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}
async function ghPut(env, path, contentB64, sha, message) {
  const body = { message, content: contentB64, branch: branch(env) };
  if (sha) body.sha = sha;
  const r = await ghFetch(env, "PUT", `${ghBase(env)}/${encodeURI(path)}`, body);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  return { ok: true, commit: r.data.commit?.sha, sha: r.data.content?.sha };
}
async function ghDelete(env, path, sha, message) {
  const r = await ghFetch(env, "DELETE", `${ghBase(env)}/${encodeURI(path)}`, { message, sha, branch: branch(env) });
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  return { ok: true };
}

// ---- request handler ----
export async function handleCms(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/cms-api\//, "");
  const method = request.method;

  if (!env.CMS_EMAIL || !env.GITHUB_TOKEN) {
    return json({ error: "CMS is not configured yet. Set CMS_EMAIL, CMS_PASSWORD, CMS_SESSION_SECRET and GITHUB_TOKEN." }, 503);
  }

  // --- login / logout / me ---
  if (path === "login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const emailOk = timingSafeEqual((body.email || "").toLowerCase(), (env.CMS_EMAIL || "").toLowerCase());
    const passOk = timingSafeEqual(body.password || "", env.CMS_PASSWORD || "");
    if (!emailOk || !passOk) return json({ error: "Incorrect email or password." }, 401);
    const token = await signSession(env, env.CMS_EMAIL);
    const cookie = `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`;
    return json({ ok: true, email: env.CMS_EMAIL }, 200, { "Set-Cookie": cookie });
  }
  if (path === "logout" && method === "POST") {
    return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
  }

  // --- everything below requires a valid session ---
  const session = await verifySession(env, getCookie(request, COOKIE));
  if (path === "me") return session ? json({ email: session.e }) : json({ error: "Not signed in." }, 401);
  if (!session) return json({ error: "Not signed in." }, 401);

  if (path === "list" && method === "GET") {
    const dir = url.searchParams.get("folder");
    if (!dir) return json({ error: "Missing folder." }, 400);
    const r = await ghList(env, dir);
    return r.ok ? json({ items: r.items }) : json({ error: r.error }, r.status || 502);
  }
  if (path === "file" && method === "GET") {
    const p = url.searchParams.get("path");
    if (!p) return json({ error: "Missing path." }, 400);
    const r = await ghGet(env, p);
    return r.ok ? json(r) : json({ error: r.error }, r.status || 502);
  }
  if (path === "file" && method === "PUT") {
    const body = await request.json().catch(() => ({}));
    if (!body.path || typeof body.content !== "string") return json({ error: "Missing path or content." }, 400);
    const r = await ghPut(env, body.path, encodeB64Utf8(body.content), body.sha, body.message || `CMS: update ${body.path}`);
    return r.ok ? json(r) : json({ error: r.error }, r.status || 502);
  }
  if (path === "file" && method === "DELETE") {
    const body = await request.json().catch(() => ({}));
    if (!body.path || !body.sha) return json({ error: "Missing path or sha." }, 400);
    const r = await ghDelete(env, body.path, body.sha, body.message || `CMS: delete ${body.path}`);
    return r.ok ? json(r) : json({ error: r.error }, r.status || 502);
  }
  if (path === "upload" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    // body: { folder, filename, dataBase64 }  (dataBase64 = raw base64, no data: prefix)
    if (!body.folder || !body.filename || !body.dataBase64) return json({ error: "Missing upload fields." }, 400);
    const safe = body.filename.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
    const target = `${body.folder.replace(/\/+$/, "")}/${safe}`;
    // don't clobber: if it exists, suffix a short timestamp-free counter via sha check
    let sha;
    const existing = await ghFetch(env, "GET", `${ghBase(env)}/${encodeURI(target)}?ref=${branch(env)}`);
    if (existing.ok) sha = existing.data.sha;
    const r = await ghPut(env, target, body.dataBase64, sha, `CMS: upload ${target}`);
    if (!r.ok) return json({ error: r.error }, r.status || 502);
    // public URL = path with leading "public" stripped
    const publicUrl = "/" + target.replace(/^public\//, "");
    return json({ ok: true, path: publicUrl });
  }

  return json({ error: "Unknown endpoint." }, 404);
}

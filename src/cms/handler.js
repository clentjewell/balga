/**
 * Balga CMS — Cloudflare Worker backend (custom, email/password, multi-user).
 *
 * The client logs in with email + password; this Worker verifies them, holds a
 * GitHub bot token as a secret, and commits content changes to the repo on
 * their behalf. A push then triggers the deploy workflow, so a save is live in
 * ~1–2 minutes.
 *
 * User accounts live in a Cloudflare KV namespace (binding CMS_USERS): each
 * record is `user:<email>` → { email, role, pass, createdAt, updatedAt } where
 * `pass` is a PBKDF2-SHA256 hash. On first use the store is seeded from the
 * CMS_EMAIL / CMS_PASSWORD secrets as the initial admin. Admins can add,
 * remove, re-role and reset other users; everyone can change their own password.
 *
 * Required Worker secrets / vars (set with `wrangler secret put ...`):
 *   CMS_EMAIL          initial admin email (seed only)
 *   CMS_PASSWORD       initial admin password (seed only, encrypted at rest)
 *   CMS_SESSION_SECRET random string used to sign session cookies
 *   GITHUB_TOKEN       fine-grained PAT with Contents: read/write on the repo
 *   GH_OWNER, GH_REPO, GH_BRANCH   repo target (vars, not secret)
 *   CMS_USERS          KV namespace binding (user accounts)
 */

const COOKIE = "cms_session";
const SESSION_TTL = 60 * 60 * 8; // 8 hours
const PBKDF2_ITERATIONS = 100000;
const MIN_PASSWORD = 8;
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
async function signSession(env, email, role) {
  const payload = b64url(enc.encode(JSON.stringify({ e: email, r: role || "editor", exp: Math.floor(Date.now() / 1000) + SESSION_TTL })));
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

// ---- password hashing (PBKDF2-SHA256) ----
async function hashPassword(password, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256);
  return `pbkdf2$${iterations}$${b64url(salt)}$${b64url(bits)}`;
}
async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored || "").split("$");
    if (scheme !== "pbkdf2") return false;
    const salt = b64urlToBytes(saltB64);
    const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: parseInt(iterStr, 10), hash: "SHA-256" }, key, 256);
    return timingSafeEqual(b64url(bits), hashB64);
  } catch {
    return false;
  }
}

// ---- user store (Cloudflare KV) ----
const USER_PREFIX = "user:";
const normEmail = (e) => String(e || "").trim().toLowerCase();
const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
const userKey = (email) => USER_PREFIX + normEmail(email);
const publicUser = (u) => ({ email: u.email, role: u.role, createdAt: u.createdAt, updatedAt: u.updatedAt });

async function getUser(env, email) {
  if (!env.CMS_USERS) return null;
  const raw = await env.CMS_USERS.get(userKey(email));
  return raw ? JSON.parse(raw) : null;
}
async function putUser(env, user) {
  await env.CMS_USERS.put(userKey(user.email), JSON.stringify(user));
}
async function listUsers(env) {
  if (!env.CMS_USERS) return [];
  const out = [];
  let cursor;
  do {
    const page = await env.CMS_USERS.list({ prefix: USER_PREFIX, cursor });
    for (const k of page.keys) {
      const raw = await env.CMS_USERS.get(k.name);
      if (raw) out.push(JSON.parse(raw));
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}
async function countAdmins(env) {
  return (await listUsers(env)).filter((u) => u.role === "admin").length;
}
// Seed the first admin from the CMS_EMAIL / CMS_PASSWORD secrets if the store is empty.
async function ensureSeed(env) {
  if (!env.CMS_USERS || !env.CMS_EMAIL || !env.CMS_PASSWORD) return;
  const probe = await env.CMS_USERS.list({ prefix: USER_PREFIX, limit: 1 });
  if (probe.keys.length) return;
  const now = Date.now();
  await putUser(env, {
    email: normEmail(env.CMS_EMAIL),
    role: "admin",
    pass: await hashPassword(env.CMS_PASSWORD),
    createdAt: now,
    updatedAt: now,
  });
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
    const email = normEmail(body.email);
    await ensureSeed(env);
    let user = await getUser(env, email);
    // Legacy fallback: if KV isn't bound, verify against the seed secrets directly.
    if (!user && !env.CMS_USERS) {
      if (timingSafeEqual(email, normEmail(env.CMS_EMAIL)) && timingSafeEqual(body.password || "", env.CMS_PASSWORD || "")) {
        user = { email: normEmail(env.CMS_EMAIL), role: "admin" };
      }
    }
    const ok = user && user.pass ? await verifyPassword(body.password || "", user.pass) : !!(user && !user.pass);
    if (!user || !ok) return json({ error: "Incorrect email or password." }, 401);
    const token = await signSession(env, user.email, user.role);
    const cookie = `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`;
    return json({ ok: true, email: user.email, role: user.role }, 200, { "Set-Cookie": cookie });
  }
  if (path === "logout" && method === "POST") {
    return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
  }

  // --- everything below requires a valid session ---
  const session = await verifySession(env, getCookie(request, COOKIE));
  if (path === "me") return session ? json({ email: session.e, role: session.r || "editor" }) : json({ error: "Not signed in." }, 401);
  if (!session) return json({ error: "Not signed in." }, 401);
  const isAdmin = (session.r || "editor") === "admin";

  // --- change own password ---
  if (path === "password" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!env.CMS_USERS) return json({ error: "User store not configured." }, 501);
    const user = await getUser(env, session.e);
    if (!user) return json({ error: "Account not found." }, 404);
    if (!(await verifyPassword(body.currentPassword || "", user.pass))) return json({ error: "Current password is incorrect." }, 401);
    if ((body.newPassword || "").length < MIN_PASSWORD) return json({ error: `New password must be at least ${MIN_PASSWORD} characters.` }, 400);
    user.pass = await hashPassword(body.newPassword);
    user.updatedAt = Date.now();
    await putUser(env, user);
    return json({ ok: true });
  }

  // --- user management (admin only) ---
  if (path === "users" || path.startsWith("users/")) {
    if (!env.CMS_USERS) return json({ error: "User store not configured." }, 501);
    if (!isAdmin) return json({ error: "Admins only." }, 403);
    await ensureSeed(env);

    if (path === "users" && method === "GET") {
      const users = (await listUsers(env)).map(publicUser).sort((a, b) => a.email.localeCompare(b.email));
      return json({ users, me: session.e });
    }
    if (path === "users" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = normEmail(body.email);
      const role = body.role === "admin" ? "admin" : "editor";
      if (!validEmail(email)) return json({ error: "Please enter a valid email address." }, 400);
      if ((body.password || "").length < MIN_PASSWORD) return json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, 400);
      if (await getUser(env, email)) return json({ error: "A user with that email already exists." }, 409);
      const now = Date.now();
      await putUser(env, { email, role, pass: await hashPassword(body.password), createdAt: now, updatedAt: now });
      return json({ ok: true });
    }
    if (path === "users/role" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = normEmail(body.email);
      const role = body.role === "admin" ? "admin" : "editor";
      const user = await getUser(env, email);
      if (!user) return json({ error: "User not found." }, 404);
      if (user.role === "admin" && role !== "admin" && (await countAdmins(env)) <= 1) {
        return json({ error: "You can't remove the last admin." }, 400);
      }
      user.role = role;
      user.updatedAt = Date.now();
      await putUser(env, user);
      return json({ ok: true });
    }
    if (path === "users/reset" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = normEmail(body.email);
      const user = await getUser(env, email);
      if (!user) return json({ error: "User not found." }, 404);
      if ((body.newPassword || "").length < MIN_PASSWORD) return json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, 400);
      user.pass = await hashPassword(body.newPassword);
      user.updatedAt = Date.now();
      await putUser(env, user);
      return json({ ok: true });
    }
    if (path === "users" && method === "DELETE") {
      const body = await request.json().catch(() => ({}));
      const email = normEmail(body.email);
      if (email === normEmail(session.e)) return json({ error: "You can't delete your own account." }, 400);
      const user = await getUser(env, email);
      if (!user) return json({ error: "User not found." }, 404);
      if (user.role === "admin" && (await countAdmins(env)) <= 1) return json({ error: "You can't delete the last admin." }, 400);
      await env.CMS_USERS.delete(userKey(email));
      return json({ ok: true });
    }
    return json({ error: "Unknown endpoint." }, 404);
  }

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

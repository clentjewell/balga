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
const RESET_TTL = 60 * 30; // password-reset links last 30 minutes, single use
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
/** Sign an arbitrary payload with an expiry — used for sessions and reset links. */
async function signPayload(env, obj, ttlSeconds) {
  const payload = b64url(enc.encode(JSON.stringify({ ...obj, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const key = await hmacKey(env.CMS_SESSION_SECRET || "dev-secret");
  const sig = b64url(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return `${payload}.${sig}`;
}
async function verifyPayload(env, token) {
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
const signSession = (env, email, role) => signPayload(env, { e: email, r: role || "editor" }, SESSION_TTL);
const verifySession = (env, token) => verifyPayload(env, token);
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
const publicUser = (u) => ({ email: u.email, name: u.name || "", role: u.role, createdAt: u.createdAt, updatedAt: u.updatedAt });
/** What to call someone in the UI when they haven't set a name yet. */
const displayName = (u) => (u && (u.name || String(u.email || "").split("@")[0])) || "";
const cleanName = (v) => String(v || "").replace(/\s+/g, " ").trim().slice(0, 80);

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

// ---- contact enquiries (Cloudflare KV, same namespace as users) ----
// Key: `enquiry:<iso timestamp>-<random>` so a prefix list comes back oldest-first
// and can just be reversed. The summary (name, email, when, read flag, preview) is
// stored as KV *metadata*, so the dashboard's counts and list need one list call —
// the full message body is only fetched when the client opens an enquiry.
const ENQUIRY_PREFIX = "enquiry:";
const PREVIEW_CHARS = 140;

export async function saveEnquiry(env, { firstName, lastName, email, message }) {
  if (!env.CMS_USERS) return { ok: false, error: "No KV namespace bound." };
  const at = new Date().toISOString();
  const id = `${at}-${crypto.randomUUID().slice(0, 8)}`;
  const name = `${firstName} ${lastName}`.trim();
  const record = { id, name, email, message, at, read: false };
  await env.CMS_USERS.put(ENQUIRY_PREFIX + id, JSON.stringify(record), {
    metadata: { name, email, at, read: false, preview: message.slice(0, PREVIEW_CHARS) },
  });
  return { ok: true, id };
}

async function listEnquiries(env) {
  if (!env.CMS_USERS) return [];
  const out = [];
  let cursor;
  do {
    const page = await env.CMS_USERS.list({ prefix: ENQUIRY_PREFIX, cursor });
    for (const k of page.keys) {
      const m = k.metadata || {};
      out.push({ id: k.name.slice(ENQUIRY_PREFIX.length), name: m.name, email: m.email, at: m.at, read: !!m.read, preview: m.preview });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  out.sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
  return out;
}

async function getEnquiry(env, id) {
  if (!env.CMS_USERS) return null;
  const raw = await env.CMS_USERS.get(ENQUIRY_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

async function setEnquiryRead(env, id, read) {
  const rec = await getEnquiry(env, id);
  if (!rec) return null;
  rec.read = !!read;
  await env.CMS_USERS.put(ENQUIRY_PREFIX + id, JSON.stringify(rec), {
    metadata: { name: rec.name, email: rec.email, at: rec.at, read: rec.read, preview: (rec.message || "").slice(0, PREVIEW_CHARS) },
  });
  return rec;
}

// ---- outgoing email (Resend) ----
async function sendEmail(env, { to, subject, text }) {
  if (!env.RESEND_API_KEY) return { ok: false, error: "not-configured" };
  const from = env.CONTACT_FROM_EMAIL || "Balga Designs <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) return { ok: false, error: (await res.text().catch(() => "")).slice(0, 200) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 200) };
  }
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
// Commits are attributed to the signed-in CMS user, so the dashboard's activity
// feed (and the repo history) shows who actually made each change rather than the
// shared bot token.
function commitAuthor(actor) {
  if (!actor || !validEmail(actor)) return undefined;
  return { name: actor.split("@")[0], email: actor };
}

async function ghPut(env, path, contentB64, sha, message, actor) {
  const body = { message, content: contentB64, branch: branch(env) };
  const author = commitAuthor(actor);
  if (author) body.author = author;
  if (sha) body.sha = sha;
  const r = await ghFetch(env, "PUT", `${ghBase(env)}/${encodeURI(path)}`, body);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  return { ok: true, commit: r.data.commit?.sha, sha: r.data.content?.sha };
}
// Commit several files in ONE commit (Git data API) — used by drag-and-drop
// reordering, which rewrites the `order` of many files at once. Doing it as a
// single commit means a single build + deploy instead of one per file.
async function ghCommitMany(env, files, message, actor) {
  const repo = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}`;
  const br = branch(env);
  const ref = await ghFetch(env, "GET", `${repo}/git/ref/heads/${encodeURI(br)}`);
  if (!ref.ok) return { ok: false, status: ref.status, error: ref.data.message };
  const headSha = ref.data.object?.sha;
  const head = await ghFetch(env, "GET", `${repo}/git/commits/${headSha}`);
  if (!head.ok) return { ok: false, status: head.status, error: head.data.message };
  const tree = await ghFetch(env, "POST", `${repo}/git/trees`, {
    base_tree: head.data.tree?.sha,
    tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content })),
  });
  if (!tree.ok) return { ok: false, status: tree.status, error: tree.data.message };
  const commitBody = { message, tree: tree.data.sha, parents: [headSha] };
  const author = commitAuthor(actor);
  if (author) commitBody.author = author;
  const commit = await ghFetch(env, "POST", `${repo}/git/commits`, commitBody);
  if (!commit.ok) return { ok: false, status: commit.status, error: commit.data.message };
  const upd = await ghFetch(env, "PATCH", `${repo}/git/refs/heads/${encodeURI(br)}`, { sha: commit.data.sha });
  if (!upd.ok) return { ok: false, status: upd.status, error: upd.data.message };
  return { ok: true, commit: commit.data.sha };
}

async function ghDelete(env, path, sha, message, actor) {
  const body = { message, sha, branch: branch(env) };
  const author = commitAuthor(actor);
  if (author) body.author = author;
  const r = await ghFetch(env, "DELETE", `${ghBase(env)}/${encodeURI(path)}`, body);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  return { ok: true };
}

/**
 * Recent content changes for the dashboard feed.
 *
 * Only changes made through the Content Manager count: the client's feed is a
 * record of what happened to their website, not of the repository. Developer
 * commits, merges and deploys are filtered out, so we over-fetch and then trim.
 */
async function ghCommits(env, limit = 20) {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/commits?sha=${encodeURIComponent(branch(env))}&per_page=100`;
  const r = await ghFetch(env, "GET", url);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  const items = (Array.isArray(r.data) ? r.data : [])
    .map((c) => ({
      sha: (c.sha || "").slice(0, 7),
      message: (c.commit?.message || "").split("\n")[0],
      author: c.commit?.author?.email || c.commit?.author?.name || "",
      at: c.commit?.author?.date || "",
    }))
    .filter((c) => /^CMS:\s/.test(c.message))
    .slice(0, limit);
  return { ok: true, items };
}

/**
 * Every image already on the site — the media library behind the image picker.
 * One recursive tree call rather than walking folders one contents-API page at
 * a time.
 */
const MEDIA_ROOT = "public/assets/";
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)$/i;
// Title / alt / caption / description per image, keyed by public URL.
const MEDIA_META_PATH = "src/data/media.json";
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
               gif: "image/gif", svg: "image/svg+xml", avif: "image/avif" };

/**
 * Serve an image straight from the repo.
 *
 * A just-uploaded image is committed immediately but only reaches the live site
 * after the next build (a minute or two), so its public URL 404s until then. The
 * library falls back to this so new uploads are visible at once.
 */
async function ghRawFile(env, path) {
  const url = `${ghBase(env)}/${encodeURI(path)}?ref=${branch(env)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.raw",
      "User-Agent": "balga-cms",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, body: await res.arrayBuffer() };
}

async function readMediaMeta(env) {
  const r = await ghGet(env, MEDIA_META_PATH);
  if (!r.ok) return { meta: {}, sha: null };
  try { return { meta: JSON.parse(r.content) || {}, sha: r.sha }; }
  catch { return { meta: {}, sha: r.sha }; }
}

async function ghMedia(env) {
  const url = `https://api.github.com/repos/${env.GH_OWNER}/${env.GH_REPO}/git/trees/${encodeURIComponent(branch(env))}?recursive=1`;
  const r = await ghFetch(env, "GET", url);
  if (!r.ok) return { ok: false, status: r.status, error: r.data.message };
  const { meta } = await readMediaMeta(env);
  const items = (r.data.tree || [])
    .filter((n) => n.type === "blob" && n.path.startsWith(MEDIA_ROOT) && IMAGE_EXT.test(n.path))
    .map((n) => {
      const name = n.path.split("/").pop();
      const folder = n.path.slice(0, n.path.length - name.length - 1);
      const url = "/" + n.path.replace(/^public\//, "");
      const m = meta[url] || {};
      return {
        path: n.path, url, name, folder: folder.replace(/^public\//, ""), size: n.size,
        title: m.title || "", alt: m.alt || "", caption: m.caption || "", description: m.description || "",
      };
    })
    .sort((a, b) => a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name));
  return { ok: true, items, truncated: !!r.data.truncated };
}

// Pages the client may publish / unpublish. `locked` mirrors src/data/pages.mjs —
// the site must always have a home and a contact page.
const PAGE_STATUS_PATH = "src/data/content/page-status.json";
const LOCKED_PAGES = new Set(["home", "contact"]);

/** Is this request carrying a valid CMS session? (used to gate /_cms/* assets) */
export async function hasCmsSession(request, env) {
  return !!(await verifySession(env, getCookie(request, COOKIE)));
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
    return json({ ok: true, email: user.email, name: user.name || "", role: user.role }, 200, { "Set-Cookie": cookie });
  }
  // --- forgot password: email a one-time reset link (no session required) ---
  if (path === "forgot" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = normEmail(body.email);
    if (!env.CMS_USERS) return json({ error: "User store not configured." }, 501);
    if (!env.RESEND_API_KEY) {
      return json({ error: "Password reset by email isn't switched on yet. Ask an admin to reset your password." }, 501);
    }
    await ensureSeed(env);
    const user = await getUser(env, email);
    // Always answer the same way: never reveal whether an account exists.
    const generic = { ok: true, message: "If that email has an account, a reset link is on its way." };
    if (!user) return json(generic);
    const jti = crypto.randomUUID();
    await env.CMS_USERS.put(`reset:${jti}`, user.email, { expirationTtl: RESET_TTL });
    const token = await signPayload(env, { e: user.email, jti }, RESET_TTL);
    const link = `${new URL(request.url).origin}/admin/#reset=${encodeURIComponent(token)}`;
    const sent = await sendEmail(env, {
      to: user.email,
      subject: "Reset your Balga Content Manager password",
      text:
        `Someone asked to reset the password for your Balga Content Manager account.\n\n` +
        `Set a new password here (the link lasts ${Math.round(RESET_TTL / 60)} minutes and works once):\n${link}\n\n` +
        `If this wasn't you, ignore this email — your password hasn't changed.`,
    });
    if (!sent.ok) {
      await env.CMS_USERS.delete(`reset:${jti}`);
      return json({ error: "Could not send the reset email. Please ask an admin to reset your password." }, 502);
    }
    return json(generic);
  }

  // --- complete a password reset from an emailed link ---
  if (path === "reset" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!env.CMS_USERS) return json({ error: "User store not configured." }, 501);
    const data = await verifyPayload(env, body.token);
    if (!data || !data.jti || !data.e) return json({ error: "That reset link has expired. Please request a new one." }, 400);
    const holder = await env.CMS_USERS.get(`reset:${data.jti}`);
    if (!holder || normEmail(holder) !== normEmail(data.e)) {
      return json({ error: "That reset link has already been used. Please request a new one." }, 400);
    }
    if ((body.newPassword || "").length < MIN_PASSWORD) {
      return json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, 400);
    }
    const user = await getUser(env, data.e);
    if (!user) return json({ error: "Account not found." }, 404);
    user.pass = await hashPassword(body.newPassword);
    user.updatedAt = Date.now();
    await putUser(env, user);
    await env.CMS_USERS.delete(`reset:${data.jti}`); // single use
    return json({ ok: true });
  }

  if (path === "logout" && method === "POST") {
    return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
  }

  // --- everything below requires a valid session ---
  const session = await verifySession(env, getCookie(request, COOKIE));
  if (path === "me") {
    if (!session) return json({ error: "Not signed in." }, 401);
    const me = await getUser(env, session.e);
    return json({ email: session.e, role: session.r || "editor", name: me ? me.name || "" : "" });
  }
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

  // --- change own display name ---
  if (path === "profile" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!env.CMS_USERS) return json({ error: "User store not configured." }, 501);
    const user = await getUser(env, session.e);
    if (!user) return json({ error: "Account not found." }, 404);
    user.name = cleanName(body.name);
    user.updatedAt = Date.now();
    await putUser(env, user);
    return json({ ok: true, name: user.name });
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
      await putUser(env, { email, name: cleanName(body.name), role, pass: await hashPassword(body.password), createdAt: now, updatedAt: now });
      return json({ ok: true });
    }
    // Edit a user: name, role and (optionally) a new password — one save, like WordPress.
    if (path === "users/update" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = normEmail(body.email);
      const user = await getUser(env, email);
      if (!user) return json({ error: "User not found." }, 404);

      if (body.name !== undefined) user.name = cleanName(body.name);

      if (body.role !== undefined) {
        const role = body.role === "admin" ? "admin" : "editor";
        if (user.role === "admin" && role !== "admin" && (await countAdmins(env)) <= 1) {
          return json({ error: "You can't remove the last admin." }, 400);
        }
        user.role = role;
      }

      // Blank means "leave the password alone".
      if (body.newPassword) {
        if (String(body.newPassword).length < MIN_PASSWORD) {
          return json({ error: `Password must be at least ${MIN_PASSWORD} characters.` }, 400);
        }
        user.pass = await hashPassword(body.newPassword);
      }

      user.updatedAt = Date.now();
      await putUser(env, user);
      return json({ ok: true, user: publicUser(user) });
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

  // --- dashboard: recent changes feed ---
  if (path === "activity" && method === "GET") {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 50);
    const r = await ghCommits(env, limit);
    if (!r.ok) return json({ error: r.error }, r.status || 502);
    // Attribute changes to Content Manager accounts by name. A change whose author
    // isn't a registered user (an older change, or one made outside the CMS) is
    // listed without a name rather than showing a GitHub identity.
    const byEmail = new Map((await listUsers(env)).map((u) => [normEmail(u.email), u]));
    const items = r.items.map((c) => ({ ...c, author: displayName(byEmail.get(normEmail(c.author))) }));
    return json({ items });
  }

  // --- media library (image picker) ---
  if (path === "media" && method === "GET") {
    const r = await ghMedia(env);
    return r.ok ? json({ items: r.items, truncated: r.truncated }) : json({ error: r.error }, r.status || 502);
  }
  // Image bytes from the repo — covers uploads that haven't been deployed yet.
  if (path === "media-file" && method === "GET") {
    const p = url.searchParams.get("path") || "";
    if (!p.startsWith(MEDIA_ROOT) || p.includes("..") || !IMAGE_EXT.test(p)) return json({ error: "Not an image path." }, 400);
    const r = await ghRawFile(env, p);
    if (!r.ok) return json({ error: "Image not found." }, r.status === 404 ? 404 : 502);
    const ext = p.split(".").pop().toLowerCase();
    return new Response(r.body, {
      headers: { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "private, max-age=300" },
    });
  }
  // Title / alt text / caption / description for one image.
  if (path === "media-meta" && method === "PUT") {
    const body = await request.json().catch(() => ({}));
    const target = String(body.url || "");
    if (!target.startsWith("/assets/")) return json({ error: "Unknown image." }, 400);
    const { meta, sha } = await readMediaMeta(env);
    const entry = {
      title: String(body.title || "").slice(0, 200),
      alt: String(body.alt || "").slice(0, 300),
      caption: String(body.caption || "").slice(0, 500),
      description: String(body.description || "").slice(0, 2000),
    };
    if (!entry.title && !entry.alt && !entry.caption && !entry.description) delete meta[target];
    else meta[target] = entry;
    const sorted = Object.fromEntries(Object.keys(meta).sort().map((k) => [k, meta[k]]));
    const content = encodeB64Utf8(JSON.stringify(sorted, null, 2) + "\n");
    const name = entry.title || target.split("/").pop();
    const r = await ghPut(env, MEDIA_META_PATH, content, sha, `CMS: update image details “${name}”`, session.e);
    return r.ok ? json({ ok: true, meta: entry }) : json({ error: r.error }, r.status || 502);
  }

  // --- dashboard: contact form enquiries ---
  if (path === "enquiries" || path.startsWith("enquiries/")) {
    if (!env.CMS_USERS) return json({ error: "Enquiry store not configured." }, 501);
    if (path === "enquiries" && method === "GET") {
      const id = url.searchParams.get("id");
      if (id) {
        const rec = await getEnquiry(env, id);
        return rec ? json({ enquiry: rec }) : json({ error: "Enquiry not found." }, 404);
      }
      const items = await listEnquiries(env);
      const unread = items.filter((e) => !e.read).length;
      return json({ items, total: items.length, unread, read: items.length - unread });
    }
    if (path === "enquiries/read" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const rec = await setEnquiryRead(env, body.id, body.read !== false);
      return rec ? json({ ok: true }) : json({ error: "Enquiry not found." }, 404);
    }
    if (path === "enquiries" && method === "DELETE") {
      const body = await request.json().catch(() => ({}));
      if (!body.id) return json({ error: "Missing id." }, 400);
      await env.CMS_USERS.delete(ENQUIRY_PREFIX + body.id);
      return json({ ok: true });
    }
    return json({ error: "Unknown endpoint." }, 404);
  }

  // --- dashboard: publish / unpublish a page ---
  if (path === "page-status") {
    const current = await ghGet(env, PAGE_STATUS_PATH);
    if (!current.ok) return json({ error: current.error }, current.status || 502);
    let statuses;
    try { statuses = JSON.parse(current.content); } catch { return json({ error: "page-status.json is not valid JSON." }, 500); }

    if (method === "GET") return json({ statuses, locked: [...LOCKED_PAGES] });

    if (method === "PUT") {
      const body = await request.json().catch(() => ({}));
      const key = String(body.key || "");
      const status = body.status === "draft" ? "draft" : "published";
      if (!(key in statuses)) return json({ error: "Unknown page." }, 404);
      if (LOCKED_PAGES.has(key) && status === "draft") {
        return json({ error: "The home and contact pages can't be unpublished." }, 400);
      }
      if (statuses[key] === status) return json({ ok: true, statuses });
      statuses[key] = status;
      const content = encodeB64Utf8(JSON.stringify(statuses, null, 2) + "\n");
      const verb = status === "draft" ? "unpublish" : "publish";
      const r = await ghPut(env, PAGE_STATUS_PATH, content, current.sha, `CMS: ${verb} the ${key} page`, session.e);
      return r.ok ? json({ ok: true, statuses }) : json({ error: r.error }, r.status || 502);
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
    const r = await ghPut(env, body.path, encodeB64Utf8(body.content), body.sha, body.message || `CMS: update ${body.path}`, session.e);
    return r.ok ? json(r) : json({ error: r.error }, r.status || 502);
  }
  // Batch save — many files, one commit, one deploy (used by reordering).
  if (path === "files" && method === "PUT") {
    const body = await request.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? body.files : null;
    if (!files || !files.length) return json({ error: "Nothing to save." }, 400);
    if (files.length > 200) return json({ error: "Too many files in one save." }, 400);
    for (const f of files) {
      if (!f || typeof f.path !== "string" || !f.path || typeof f.content !== "string") {
        return json({ error: "Each file needs a path and content." }, 400);
      }
    }
    const r = await ghCommitMany(env, files, body.message || `CMS: update ${files.length} files`, session.e);
    return r.ok ? json(r) : json({ error: r.error }, r.status || 502);
  }
  if (path === "file" && method === "DELETE") {
    const body = await request.json().catch(() => ({}));
    if (!body.path || !body.sha) return json({ error: "Missing path or sha." }, 400);
    const r = await ghDelete(env, body.path, body.sha, body.message || `CMS: delete ${body.path}`, session.e);
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
    const r = await ghPut(env, target, body.dataBase64, sha, `CMS: upload image ${safe}`, session.e);
    if (!r.ok) return json({ error: r.error }, r.status || 502);
    // public URL = path with leading "public" stripped
    const publicUrl = "/" + target.replace(/^public\//, "");
    return json({ ok: true, path: publicUrl });
  }

  return json({ error: "Unknown endpoint." }, 404);
}

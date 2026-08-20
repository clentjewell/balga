// Smoke-checks a deployed site over the network. Defaults to production; point it
// at a preview with DEPLOY_URL and set EXPECT_NOINDEX=1 so the robots assertions
// flip to match that deployment.
//
// It never submits a real enquiry: the contact endpoint is probed with the
// honeypot field (silently accepted, nothing stored) and with invalid input
// (rejected before storage), so running this can't pollute the client's inbox.
const BASE = (process.env.DEPLOY_URL || 'https://balgadesigns.com.au').replace(/\/$/, '');
const EXPECT_NOINDEX = process.env.EXPECT_NOINDEX === '1';
const ORIGIN_HOST = BASE.replace(/^https?:\/\//, '');
const routes = ['/', '/about/', '/services/', '/projects/', '/pricing/', '/balga-blog/', '/contact/', '/what-are-native-gardens/', '/why-designing-and-planning-are-crucial-for-successful-landscaping/', '/balga-meaning-purpose/'];
let fail = 0;
const okmark = (b) => (b ? 'OK ' : (fail++, 'FAIL'));

async function head(url) { const r = await fetch(url, { redirect: 'manual' }); return r; }

// 1. routes + content
const assetSet = new Set();
for (const path of routes) {
  const r = await fetch(BASE + path);
  const html = await r.text();
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1] || '';
  const noindex = /noindex/.test(r.headers.get('x-robots-tag') || '');
  const hasHeader = html.includes('site-header');
  const hasFooter = html.includes('site-footer');
  // Leftovers from the WordPress original, which must never reappear.
  const wpRefs = (html.match(/wp-content|wp-json|elementor/gi) || []).length;
  // Every page must claim its own URL on this origin — a canonical pointing at a
  // preview host is the failure mode that silently costs the site its rankings.
  const canonical = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '';
  const canonicalOk = canonical === `${BASE}${path}`;
  const ok = r.status === 200 && hasHeader && hasFooter && wpRefs === 0 && noindex === EXPECT_NOINDEX && canonicalOk;
  console.log(`${okmark(ok)} ${path} [${r.status}] "${title.slice(0, 40)}" noindex=${noindex} wpRefs=${wpRefs}${canonicalOk ? '' : ` canonical=${canonical || '(missing)'}`}`);
  // collect local asset refs
  for (const m of html.matchAll(/(?:src|href)="(\/(?:assets|fonts|_astro)\/[^"]+)"/g)) assetSet.add(m[1]);
  for (const m of html.matchAll(/url\('(\/assets\/[^']+)'\)/g)) assetSet.add(m[1]);
}

// 2. security headers on home
const h = await head(BASE + '/');
console.log(`\n${okmark(/default-src/.test(h.headers.get('content-security-policy') || ''))} CSP header present`);
console.log(`${okmark(!/unsafe-inline/.test((h.headers.get('content-security-policy') || '').split('script-src')[1] || ''))} CSP script-src is hash-based`);
console.log(`${okmark(h.headers.get('x-content-type-options') === 'nosniff')} X-Content-Type-Options`);
console.log(`${okmark(/max-age=\d+/.test(h.headers.get('strict-transport-security') || ''))} HSTS`);
console.log(`${okmark(/noindex/.test(h.headers.get('x-robots-tag') || '') === EXPECT_NOINDEX)} X-Robots-Tag ${EXPECT_NOINDEX ? 'noindex' : 'absent'}`);

// 3. the admin app is private on every deployment
const admin = await head(BASE + '/admin/');
console.log(`${okmark(/noindex/.test(admin.headers.get('x-robots-tag') || ''))} /admin/ noindex`);

// 4. signed-out visitors can't read the internal paths
for (const p of ['/_cms/csp.json', '/cms-config.json', '/review/']) {
  const r = await fetch(BASE + p);
  console.log(`${okmark(r.status === 404)} ${p} gated [${r.status}]`);
}

// 5. asset availability (sample up to 60)
const assets = [...assetSet];
let broken = 0, checked = 0;
for (const a of assets.slice(0, 60)) {
  const r = await head(BASE + a); checked++;
  if (r.status !== 200) { broken++; console.log(`  FAIL asset ${a} [${r.status}]`); }
}
console.log(`${okmark(broken === 0)} assets: ${checked} checked, ${broken} broken (of ${assets.length} unique)`);

// 6. 404
const nf = await fetch(BASE + '/definitely-not-a-page-xyz/');
const nfHtml = await nf.text();
console.log(`${okmark(nf.status === 404 && /Page Not Found|grown here/i.test(nfHtml))} custom 404 [${nf.status}]`);

// 7. trailing slash redirect
const ts = await fetch(BASE + '/about', { redirect: 'manual' });
console.log(`${okmark(ts.status === 307 || ts.status === 301 || ts.status === 308)} /about -> redirect [${ts.status}]`);

// 8. api/contact — both probes are storage-free (see the note at the top)
const apiPot = await fetch(BASE + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'A', lastName: 'B', email: 'a@b.com', message: 'hello there', company: 'bot' }) });
const potJson = await apiPot.json().catch(() => ({}));
console.log(`${okmark(apiPot.status === 200 && potJson.status === 'sent')} /api/contact honeypot accepted [${apiPot.status}]`);
const apiBad = await fetch(BASE + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' }) });
console.log(`${okmark(apiBad.status === 422)} /api/contact validation [${apiBad.status}]`);

// 9. sitemap + robots
const sm = await fetch(BASE + '/sitemap.xml'); const smText = await sm.text();
const urls = (smText.match(/<loc>([^<]+)<\/loc>/g) || []).map((u) => u.replace(/<\/?loc>/g, ''));
const strayHost = urls.find((u) => !u.startsWith(BASE + '/'));
console.log(`${okmark(sm.status === 200 && urls.length >= 10 && !strayHost)} sitemap.xml (${urls.length} urls)${strayHost ? ` stray=${strayHost}` : ''}`);
const rb = await fetch(BASE + '/robots.txt'); const rbText = await rb.text();
// Cloudflare may prepend its own managed block, so read only our section.
const ours = rbText.slice(rbText.indexOf('# Balga Designs'));
const robotsOk = EXPECT_NOINDEX
  ? /User-agent: \*\nDisallow: \//.test(ours)
  : /User-agent: \*\nAllow: \//.test(ours) && ours.includes(`Sitemap: ${BASE}/sitemap.xml`);
console.log(`${okmark(rb.status === 200 && robotsOk)} robots.txt ${EXPECT_NOINDEX ? 'disallows' : 'allows'} crawling`);
if (!EXPECT_NOINDEX && /^User-agent: (GPTBot|ClaudeBot|CCBot)\nDisallow: \//m.test(rbText)) {
  console.log(`  note: something upstream (Cloudflare managed robots.txt?) is blocking AI crawlers on ${ORIGIN_HOST}`);
}

// 10. font
const font = await head(BASE + '/fonts/montserrat-var.woff2');
console.log(`${okmark(font.status === 200 && /immutable/.test(font.headers.get('cache-control') || ''))} font immutable cache [${font.status}]`);

console.log(`\n${fail === 0 ? '✅ ALL DEPLOYED CHECKS PASSED' : '❌ ' + fail + ' CHECK(S) FAILED'}`);
if (fail) process.exitCode = 1;

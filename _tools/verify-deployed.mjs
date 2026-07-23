const BASE = process.env.DEPLOY_URL || 'https://balga-designs-preview.clent.workers.dev';
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
  const wpRefs = (html.match(/balgadesigns\.com\.au|wp-content|elementor/gi) || []).length;
  console.log(`${okmark(r.status === 200 && hasHeader && hasFooter && wpRefs === 0 && noindex)} ${path} [${r.status}] "${title.slice(0,40)}" noindex=${noindex} wpRefs=${wpRefs}`);
  // collect local asset refs
  for (const m of html.matchAll(/(?:src|href)="(\/(?:assets|fonts|_astro)\/[^"]+)"/g)) assetSet.add(m[1]);
  for (const m of html.matchAll(/url\('(\/assets\/[^']+)'\)/g)) assetSet.add(m[1]);
}

// 2. security headers on home
const h = await head(BASE + '/');
console.log(`\n${okmark(/default-src/.test(h.headers.get('content-security-policy')||''))} CSP header present`);
console.log(`${okmark(h.headers.get('x-content-type-options') === 'nosniff')} X-Content-Type-Options`);
console.log(`${okmark(/noindex/.test(h.headers.get('x-robots-tag')||''))} X-Robots-Tag noindex`);

// 3. asset availability (sample up to 40)
const assets = [...assetSet];
let broken = 0, checked = 0;
for (const a of assets.slice(0, 60)) {
  const r = await head(BASE + a); checked++;
  if (r.status !== 200) { broken++; console.log(`  FAIL asset ${a} [${r.status}]`); }
}
console.log(`${okmark(broken === 0)} assets: ${checked} checked, ${broken} broken (of ${assets.length} unique)`);

// 4. 404
const nf = await fetch(BASE + '/definitely-not-a-page-xyz/');
const nfHtml = await nf.text();
console.log(`${okmark(nf.status === 404 && /Page Not Found|grown here/i.test(nfHtml))} custom 404 [${nf.status}]`);

// 5. trailing slash redirect
const ts = await fetch(BASE + '/about', { redirect: 'manual' });
console.log(`${okmark(ts.status === 307 || ts.status === 301 || ts.status === 308)} /about -> redirect [${ts.status}]`);

// 6. api/contact preview
const api = await fetch(BASE + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: 'A', lastName: 'B', email: 'a@b.com', message: 'hello there' }) });
const apiJson = await api.json();
console.log(`${okmark(api.status === 200 && apiJson.status === 'preview')} /api/contact preview mode [${api.status}] status=${apiJson.status}`);
const apiBad = await fetch(BASE + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' }) });
console.log(`${okmark(apiBad.status === 422)} /api/contact validation [${apiBad.status}]`);

// 7. sitemap + robots
const sm = await fetch(BASE + '/sitemap.xml'); const smText = await sm.text();
console.log(`${okmark(sm.status === 200 && (smText.match(/<url>/g)||[]).length === 10)} sitemap.xml (${(smText.match(/<url>/g)||[]).length} urls)`);
const rb = await fetch(BASE + '/robots.txt'); const rbText = await rb.text();
console.log(`${okmark(rb.status === 200 && /Disallow: \//.test(rbText))} robots.txt disallow`);

// 8. font
const font = await head(BASE + '/fonts/montserrat-var.woff2');
console.log(`${okmark(font.status === 200 && /immutable/.test(font.headers.get('cache-control')||''))} font immutable cache [${font.status}]`);

console.log(`\n${fail === 0 ? '✅ ALL DEPLOYED CHECKS PASSED' : '❌ ' + fail + ' CHECK(S) FAILED'}`);

import fs from 'node:fs';
import path from 'node:path';

const HTMLDIR = path.resolve('_audit/html');
const ROOT = path.resolve('_audit/mirror');
const PAGES = path.join(ROOT, 'pages');
fs.mkdirSync(PAGES, { recursive: true });
const HOST = 'balgadesigns.com.au';

const ROUTES = [
  ['home','/'], ['about','/about/'], ['services','/services/'], ['projects','/projects/'],
  ['pricing','/pricing/'], ['blog','/balga-blog/'], ['contact','/contact/'],
  ['article-native-gardens','/what-are-native-gardens/'],
  ['article-designing-planning','/why-designing-and-planning-are-crucial-for-successful-landscaping/'],
  ['article-balga-meaning','/balga-meaning-purpose/'],
  ['_404probe', null],
];

function unescapeUrl(s){
  return s.replace(/\\\//g,'/').replace(/&#0?38;/g,'&').replace(/&amp;/g,'&');
}
function localPathFor(u){ // URL obj
  let p = u.pathname;
  if (p.endsWith('/')) p += 'index.html';
  return p; // root-relative for balga host
}
function fsPathFor(u){ return path.join(ROOT, decodeURIComponent(localPathFor(u))); }

// collect balga URLs from a text blob
function findBalgaUrls(text){
  const set = new Set();
  const re = /https?:(?:\\?\/){2}balgadesigns\.com\.au[^\s"'`)<>\\]*/g;
  let m;
  while ((m = re.exec(text))) {
    let url = unescapeUrl(m[0]);
    url = url.replace(/[.,;:]+$/,'');
    set.add(url);
  }
  // protocol-relative
  const re2 = /(?:\\?\/){2}balgadesigns\.com\.au[^\s"'`)<>\\]*/g;
  while ((m = re2.exec(text))) {
    let url = unescapeUrl(m[0]); if(!/^https?:/.test(url)) url = 'https:'+url;
    url = url.replace(/[.,;:]+$/,'');
    set.add(url);
  }
  return [...set];
}

async function download(url){
  const u = new URL(url);
  const fp = fsPathFor(u);
  if (fs.existsSync(fp)) return { fp, cached:true };
  for (let i=0;i<4;i++){
    try{
      const r = await fetch(url, { redirect:'follow' });
      if (!r.ok) { if (i===3) console.error('DL',r.status,url); if(r.status>=400&&r.status<500) return null; throw new Error('status '+r.status); }
      const buf = Buffer.from(await r.arrayBuffer());
      fs.mkdirSync(path.dirname(fp), { recursive:true });
      fs.writeFileSync(fp, buf);
      const ct = r.headers.get('content-type')||'';
      return { fp, ct, buf };
    }catch(e){ await new Promise(s=>setTimeout(s,1500*(i+1))); }
  }
  console.error('FAILDL', url);
  return null;
}

// rewrite all balga refs -> root-relative
function rewrite(text){
  return text
    .replace(/https?:\\\/\\\/balgadesigns\.com\.au/g, '')      // escaped
    .replace(/https?:\/\/balgadesigns\.com\.au/g, '')
    .replace(/\\\/\\\/balgadesigns\.com\.au/g, '')
    .replace(/\/\/balgadesigns\.com\.au/g, '');
}

const cssQueue = [];
const seenCss = new Set();
const allAssets = new Set();

// 1. process HTML files: find balga urls, categorize
for (const [slug] of ROUTES){
  const f = path.join(HTMLDIR, slug + '.html');
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f,'utf8');
  for (const url of findBalgaUrls(html)){
    allAssets.add(url);
    if (/\.css(\?|$)/.test(url) && !seenCss.has(url)) { seenCss.add(url); cssQueue.push(url); }
  }
}

console.log('initial assets from HTML:', allAssets.size, 'css:', cssQueue.length);

// 2. download CSS first, parse for url()/@import, recurse
async function processCss(url){
  const res = await download(url);
  if (!res) return;
  let css = fs.existsSync(res.fp) ? fs.readFileSync(res.fp,'utf8') : '';
  const base = new URL(url);
  // find url(...) and @import
  const urls = [];
  const reUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  let m;
  while ((m = reUrl.exec(css))) urls.push(m[1]);
  const reImp = /@import\s+['"]([^'"]+)['"]/g;
  while ((m = reImp.exec(css))) urls.push(m[1]);
  for (let ref of urls){
    ref = ref.trim();
    if (ref.startsWith('data:')) continue;
    let abs;
    try { abs = new URL(unescapeUrl(ref), base); } catch { continue; }
    if (abs.hostname !== HOST) continue;
    const full = abs.origin + abs.pathname + abs.search;
    allAssets.add(full);
    if (/\.css(\?|$)/.test(abs.pathname) && !seenCss.has(full)){ seenCss.add(full); await processCss(full); }
    else await download(full);
  }
  // rewrite css content root-relative and save
  fs.writeFileSync(res.fp, rewrite(css));
}
for (const c of cssQueue) await processCss(c);
console.log('after css, total assets:', allAssets.size);

// 3. download all remaining assets (images, js, fonts, etc.) — skip html pages themselves
let n=0;
for (const url of allAssets){
  const u = new URL(url);
  if (/\.css(\?|$)/.test(u.pathname)) continue; // done
  await download(url);
  if(++n % 40 === 0) console.log('downloaded', n);
}
console.log('downloaded assets:', n);

// 4. rewrite + save HTML pages into pages/
for (const [slug] of ROUTES){
  const f = path.join(HTMLDIR, slug + '.html');
  if (!fs.existsSync(f)) continue;
  let html = fs.readFileSync(f,'utf8');
  html = rewrite(html);
  // neutralize external analytics/tracking scripts to speed local render
  html = html.replace(/<script[^>]+googletagmanager[^>]*><\/script>/g,'');
  fs.writeFileSync(path.join(PAGES, slug + '.html'), html);
}
console.log('MIRROR DONE. assets stored under', ROOT);

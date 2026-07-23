import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const HTMLDIR = path.resolve('_audit/html');
const OUT = path.resolve('_audit');
const ROUTES = [
  ['home','/'], ['about','/about/'], ['services','/services/'], ['projects','/projects/'],
  ['pricing','/pricing/'], ['blog','/balga-blog/'], ['contact','/contact/'],
  ['article-native-gardens','/what-are-native-gardens/'],
  ['article-designing-planning','/why-designing-and-planning-are-crucial-for-successful-landscaping/'],
  ['article-balga-meaning','/balga-meaning-purpose/'],
];

function clean(s){ return (s||'').replace(/\s+/g,' ').trim(); }

const out = {};
for (const [slug,url] of ROUTES){
  const html = fs.readFileSync(path.join(HTMLDIR, slug+'.html'),'utf8');
  const root = parse(html, { blockTextElements:{ script:false, style:false } });
  // meta
  const title = clean(root.querySelector('title')?.text);
  const metaDesc = root.querySelector('meta[name=description]')?.getAttribute('content')
    || root.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
  const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  const canonical = root.querySelector('link[rel=canonical]')?.getAttribute('href') || '';
  // main content: remove header/footer/script/style/nav to reduce noise? keep but mark
  const body = root.querySelector('body');
  // walk for headings, paragraphs, buttons, list items, links, images in order
  const flow = [];
  const walk = (node) => {
    for (const c of node.childNodes){
      if (c.nodeType !== 1) continue;
      const tag = c.rawTagName?.toLowerCase();
      if (['script','style','svg','noscript'].includes(tag)) continue;
      if (/^h[1-6]$/.test(tag||'')){ const t=clean(c.text); if(t) flow.push({[tag]:t}); continue; }
      if (tag==='p'){ const t=clean(c.text); if(t) flow.push({p:t}); continue; }
      if (tag==='a'){ const t=clean(c.text); const cls=c.getAttribute('class')||''; if(t && (cls.includes('button')||c.querySelector('button'))) flow.push({btn:t}); }
      if (tag==='li'){ const t=clean(c.text); if(t && !c.querySelector('li')) { flow.push({li:t}); continue; } }
      if (tag==='img'){ const alt=c.getAttribute('alt'); const src=(c.getAttribute('src')||'').replace(/https?:\/\/balgadesigns\.com\.au/,''); if(src) flow.push({img:src, alt:alt||''}); continue; }
      walk(c);
    }
  };
  walk(body);
  out[slug] = { url, title, metaDesc, ogImage, canonical, flow };
  console.log(slug, 'flow items', flow.length);
}
fs.writeFileSync(path.join(OUT,'content-flow.json'), JSON.stringify(out,null,2));
console.log('CONTENT DONE');

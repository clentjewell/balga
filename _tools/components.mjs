import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';
const HTMLDIR = path.resolve('_audit/html');
const OUT = path.resolve('_audit');
const ROUTES = ['home','about','services','projects','pricing','blog','contact','article-native-gardens','article-designing-planning','article-balga-meaning'];
const strip = u => (u||'').replace(/https?:\/\/balgadesigns\.com\.au/,'');

const comparisons = {}, allImages = {}, cssBgs = {};
for (const slug of ROUTES){
  const html = fs.readFileSync(path.join(HTMLDIR, slug+'.html'),'utf8');
  const root = parse(html);
  // comparisons
  const comps = root.querySelectorAll('.elementskit-image-comparison').map(el=>{
    const imgs = el.querySelectorAll('img').map(i=>strip(i.getAttribute('src')));
    return { before: imgs[0]||null, after: imgs[1]||null,
      labelBefore: el.getAttribute('data-label_before')||'Before',
      labelAfter: el.getAttribute('data-label_after')||'After',
      offset: el.getAttribute('data-offset')||'0.5' };
  });
  comparisons[slug] = comps;
  // all upload images (from src + srcset, take largest / original)
  const set = new Set();
  root.querySelectorAll('img').forEach(i=>{
    const s = i.getAttribute('src'); if (s && /wp-content\/uploads/.test(s)) set.add(strip(s));
  });
  // also raw regex for any uploads referenced (backgrounds in inline style)
  const re = /wp-content\/uploads\/[^"')\s]+\.(?:jpg|jpeg|png|webp|gif|svg)/gi; let m;
  const bg = new Set();
  while((m=re.exec(html))) bg.add('/'+m[0]);
  allImages[slug] = [...set];
  cssBgs[slug] = [...bg];
}
fs.writeFileSync(path.join(OUT,'comparisons.json'), JSON.stringify(comparisons,null,2));
fs.writeFileSync(path.join(OUT,'images-by-page.json'), JSON.stringify({allImages,cssBgs},null,2));
for (const s of ROUTES) console.log(s, 'comparisons', comparisons[s].length, 'imgs', allImages[s].length, 'refUploads', cssBgs[s].length);
// unique originals across whole site (strip -WxH suffix)
const allSet = new Set();
for (const s of ROUTES){ for(const u of cssBgs[s]) allSet.add(u); }
const originals = new Set([...allSet].map(u=>u.replace(/-\d+x\d+(\.[a-z]+)$/i,'$1')));
fs.writeFileSync(path.join(OUT,'all-upload-originals.json'), JSON.stringify([...originals].sort(),null,2));
console.log('TOTAL unique upload refs', allSet.size, 'unique originals', originals.size);

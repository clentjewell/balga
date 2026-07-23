import fs from 'node:fs';
import path from 'node:path';
const OUT = path.resolve('_audit/html');
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://balgadesigns.com.au';
const ROUTES = [
  ['home','/'], ['about','/about/'], ['services','/services/'], ['projects','/projects/'],
  ['pricing','/pricing/'], ['blog','/balga-blog/'], ['contact','/contact/'],
  ['article-native-gardens','/what-are-native-gardens/'],
  ['article-designing-planning','/why-designing-and-planning-are-crucial-for-successful-landscaping/'],
  ['article-balga-meaning','/balga-meaning-purpose/'],
];
async function get(url){
  for(let i=0;i<4;i++){
    try{ const r=await fetch(url,{redirect:'follow'}); if(r.ok||r.status===404) return {status:r.status,text:await r.text(),ct:r.headers.get('content-type')}; }
    catch(e){ console.error('retry',url,e.message); await new Promise(s=>setTimeout(s,2000*(i+1))); }
  }
  return null;
}
for(const [slug,u] of ROUTES){
  const res=await get(BASE+u);
  if(!res){ console.log('FAIL',slug); continue; }
  fs.writeFileSync(path.join(OUT,slug+'.html'), res.text);
  console.log(slug, res.status, res.text.length);
}
// 404 probe
const nf = await get(BASE+'/no-such-page-xyz-404/');
if(nf){ fs.writeFileSync(path.join(OUT,'_404probe.html'), nf.text); console.log('404probe', nf.status, nf.text.length); }
console.log('DONE');

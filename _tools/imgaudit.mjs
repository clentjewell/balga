import { parse } from 'node-html-parser';
import fs from 'node:fs';
// combined page CSS
const dir='_audit/mirror/wp-content/uploads/elementor/css';
const css=fs.readdirSync(dir).filter(f=>/^post-\d+\.css$/.test(f)).map(f=>fs.readFileSync(dir+'/'+f,'utf8')).join('\n');
// map elementId -> bg image
const bgMap={};
const re=/\.elementor-element-([a-z0-9]+)[^{}]*\{[^}]*?background-image:url\(("?)([^")]+)\2\)/g; let m;
while((m=re.exec(css))){ const id=m[1], url=m[3].replace(/https?:\/\/balgadesigns\.com\.au/,''); if(!/line4|\.svg/.test(url)) bgMap[id]=url; }
const T=s=>(s||'').replace(/\s+/g,' ').trim();
const strip=u=>(u||'').replace(/https?:\/\/balgadesigns\.com\.au/,'').replace(/-\d+x\d+(\.[a-z0-9]+)$/i,'$1');
const pages=['home','about','services','projects','pricing','balga-blog','contact'];
for(const pg of pages){
  const file='_audit/html/'+(pg==='balga-blog'?'blog':pg)+'.html';
  const root=parse(fs.readFileSync(file,'utf8'));
  console.log('\n################ '+pg+' ################');
  // walk top sections in order
  const secs=root.querySelectorAll('.elementor-top-section').filter(s=>{let a=s.parentNode,n=false;while(a){if(a.classList&&a.classList.contains&&a.classList.contains('elementor-top-section')){n=true;break;}a=a.parentNode;}return !n;});
  secs.forEach((sec,i)=>{
    const heads=sec.querySelectorAll('h1,h2,h3').map(h=>T(h.text)).filter(Boolean).slice(0,2).join(' | ')||'(no heading)';
    // section + descendant element bg images
    const ids=[...new Set((sec.toString().match(/elementor-element-([a-z0-9]+)/g)||[]).map(x=>x.replace('elementor-element-','')))];
    const bgs=[...new Set(ids.map(id=>bgMap[id]).filter(Boolean))];
    const imgs=[...new Set(sec.querySelectorAll('img').map(x=>strip(x.getAttribute('src'))).filter(s=>/uploads/.test(s)&&!/Logo/i.test(s)))];
    console.log(`[${i}] ${heads}`);
    if(bgs.length) console.log('     BG: '+bgs.join('  '));
    if(imgs.length) console.log('     IMG: '+imgs.slice(0,8).join('  '));
  });
}

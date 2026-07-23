import fs from 'node:fs';
import path from 'node:path';
const BASE='https://balgadesigns.com.au';
const U='/wp-content/uploads/';
const PUB=path.resolve('public/assets');
const MIRROR=path.resolve('_audit/mirror');

// manifest: dest -> source path (under site root)
const M = {
  // branding
  'branding/logo-white.png': U+'2024/08/Balga-Designs-Logo-with-TAGLINE_White.png',
  'branding/logo-mark.png':  U+'2024/08/Balga-Designs-Logo.png',
  // icons
  'icons/icon1.png': U+'2024/08/icon1.png',
  'icons/icon2.png': U+'2024/08/icon2.png',
  'icons/icon3.png': U+'2024/08/icon3.png',
  'icons/icon4.png': U+'2024/08/icon4.png',
  'icons/icon7.png': U+'2024/08/icon7.png',
  'icons/arrow-4.png': U+'2024/08/arrow_Asset-4.png',
  'icons/arrow-5.png': U+'2024/08/arrow_Asset-5.png',
  // home
  'home/feature-1.jpeg': U+'2025/04/image-1.jpeg',
  'home/feature-2.jpeg': U+'2025/04/image-2.jpeg',
  // about
  'about/fire.jpg': U+'2024/09/Fire.jpg',
  'about/evening-view.jpg': U+'2024/09/Evening-view-at-balga-designs.jpg',
  // services (elementor thumbs = displayed crops)
  'services/landscape-design.jpg': U+'elementor/thumbs/design-plans-AI-r4td2ikvebns6qblmaobxyxzigmh6mq3x7pp2a2h58.jpg',
  'services/garden-facelift.jpeg': U+'elementor/thumbs/Balga-Designs-Garden-scaled-qtt7h02sz9sd3i67v56pmdq6k0csl5l3b3xu7gojjc.jpeg',
  'services/decorative-plants.png': U+'elementor/thumbs/Screenshot-2025-04-24-at-3.40.27 pm-r4teqcyyilkzcze865x8ovah1lnr8waw5eyl0hc4zw.png',
  'services/pest-management.jpg': U+'elementor/thumbs/IMG_4063-scaled-r4tf0uu2tzy6ykexg3e0oicrt42w2mrvc0nzqf4dm0.jpg',
  'services/weed-control.jpg': U+'elementor/thumbs/IMG_3138-scaled-r4wx2c4oy0ot4owcj2sy77v9ss95cisfuu9dxuc394.jpg',
  'services/horticulture.png': U+'elementor/thumbs/garden-bed-I-r4wzdrb0rdm2k0ttraf9q0pz4gjwaf1esnumk2cx0g.png',
  // pricing
  'pricing/package-1.jpg':  U+'2025/05/Package-1-717x512px.jpg',
  'pricing/package-2.jpeg': U+'2025/05/Package-2-717x512px.jpeg',
  'pricing/package-3.jpg':  U+'2025/05/Package3-717x512px.jpg',
  'pricing/package-4.jpg':  U+'2025/05/Package4-717x512px.jpg',
  // projects 7 pairs
  'projects/project-01/before.jpg': U+'2024/09/Before-Balgs-deisgn-project_1600x900px.jpg',
  'projects/project-01/after.jpg':  U+'2024/09/After-Balga-Designs.jpg',
  'projects/project-02/before.jpg': U+'2024/09/Before-balga-designs-projects.jpg',
  'projects/project-02/after.jpeg': U+'2024/09/Blaga-Designs-scaled.jpeg',
  'projects/project-03/before.jpg': U+'2024/09/Balga-designs-projects-1.jpg',
  'projects/project-03/after.jpg':  U+'2025/04/IMG_4948-1-scaled.jpg',
  'projects/project-04/before.jpg': U+'2024/09/Project-2-before.jpg',
  'projects/project-04/after.jpeg': U+'2024/09/Project-2-scaled.jpeg',
  'projects/project-05/before.jpeg':U+'2024/09/before-3-scaled.jpeg',
  'projects/project-05/after.jpeg': U+'2024/09/after-4-scaled.jpeg',
  'projects/project-06/before.jpeg':U+'2024/09/before-2-scaled.jpeg',
  'projects/project-06/after.jpeg': U+'2024/09/after-2-1.jpeg',
  'projects/project-07/before.jpg': U+'2025/04/IMG_5268-scaled.jpg',
  'projects/project-07/after.jpg':  U+'2025/04/IMG_6384-scaled.jpg',
  // home projects preview after (variant)
  'projects/preview-01-after.jpeg': U+'2024/09/Poject-1-after-balga-designs-1.jpeg',
  // blog featured
  'blog/native-gardens.webp': U+'2025/05/native-gardens-7.webp',
  'blog/designing-planning.jpg': U+'2025/04/unnamed-file.jpg',
  'blog/balga-meaning.jpg': U+'2024/08/NewrybarLandscapeDesign_63.jpg',
  // article: native gardens
  'blog/native-gardens/native-gardens-7.webp': U+'2025/05/native-gardens-7.webp',
  'blog/native-gardens/native-gardens-3.jpg': U+'2025/05/Native-gardens-3.jpg',
  'blog/native-gardens/native-gardens-1.jpg': U+'2025/05/Native-gardens-1.jpg',
  'blog/native-gardens/native-gardens-2.jpg': U+'2025/05/Native-gardens-2.jpg',
  'blog/native-gardens/native-gardens.jpg': U+'2025/05/Native-gardens.jpg',
  'blog/native-gardens/cow-paddock-country-garden.jpg': U+'2024/09/A-Vacant-Cow-Paddock-Turned-Relaxed-Australian-Country-Garden.jpg',
  // article: designing & planning
  'blog/designing-planning/why-designing-2.jpg': U+'2025/05/Why-Designing-2.jpg',
  'blog/designing-planning/why-designing-3.jpg': U+'2025/05/Why-Designing-3-.jpg',
  'blog/designing-planning/why-designing.jpg': U+'2025/05/Why-Designing.jpg',
  'blog/designing-planning/design-3.webp': U+'2025/05/desing-3.webp',
  'blog/designing-planning/design-2.webp': U+'2025/05/design-2.webp',
  'blog/designing-planning/image-6.jpeg': U+'2025/04/image-6.jpeg',
  // article: balga meaning
  'blog/balga-meaning/newrybar-63.jpg': U+'2024/08/NewrybarLandscapeDesign_63.jpg',
  'blog/balga-meaning/grass-tree-horizon.jpg.webp': U+'2025/04/Grass-Tree-Horizon-Landscape-KARINA-JAMBRAK-GICLEE-ART-PRINT-2.jpg.webp',
  'blog/balga-meaning/balga-meaning-2.jpg': U+'2025/05/Balga-meaning-2.jpg',
  'blog/balga-meaning/balga-meaning.jpeg': U+'2025/05/Balga-Meaning.jpeg',
};

async function fetchBuf(url){
  for(let i=0;i<4;i++){ try{ const r=await fetch(url); if(r.ok) return Buffer.from(await r.arrayBuffer()); if(r.status===404) return null; }catch(e){} await new Promise(s=>setTimeout(s,1200*(i+1))); }
  return null;
}
const inventory=[];
let ok=0, fail=0;
for(const [dest,srcPath] of Object.entries(M)){
  const fp=path.join(PUB,dest);
  fs.mkdirSync(path.dirname(fp),{recursive:true});
  // prefer mirror copy for exactness; else fetch
  const mirrorFile=path.join(MIRROR, decodeURIComponent(srcPath.replace(/^\//,'')));
  let buf=null, from='';
  if(fs.existsSync(mirrorFile) && fs.statSync(mirrorFile).size>0){ buf=fs.readFileSync(mirrorFile); from='mirror'; }
  if(!buf){ buf=await fetchBuf(BASE+encodeURI(srcPath)); from='fetch'; }
  if(!buf){ console.error('MISSING',dest,srcPath); fail++; inventory.push({dest,source:BASE+srcPath,status:'MISSING'}); continue; }
  fs.writeFileSync(fp,buf);
  inventory.push({dest:'/assets/'+dest, source:BASE+srcPath, bytes:buf.length, from});
  ok++;
}
fs.mkdirSync(path.resolve('audit'),{recursive:true});
fs.writeFileSync(path.resolve('audit/asset-inventory.json'), JSON.stringify({generated:'phase-2', totalAssets:inventory.length, assets:inventory},null,2));
console.log('assets ok',ok,'fail',fail);

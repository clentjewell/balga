import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('_audit/mirror');
fs.mkdirSync('qa/reference', { recursive: true });
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json','.ico':'image/x-icon' };
const srv = http.createServer((req,res)=>{
  let u=decodeURIComponent(req.url.split('?')[0]);
  let fp = u.startsWith('/page/') ? path.join(ROOT,'pages',u.slice(6)+'.html') : path.join(ROOT,(u.endsWith('/')?u+'index.html':u));
  fs.readFile(fp,(e,b)=>{ if(e){res.statusCode=404;res.end('nf');return;} res.setHeader('content-type',MIME[path.extname(fp).toLowerCase()]||'application/octet-stream'); res.end(b); });
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const PORT=srv.address().port;
const b=await chromium.launch({args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1})).newPage();
p.on('console',()=>{}); p.on('pageerror',()=>{});
await p.goto(`http://127.0.0.1:${PORT}/page/home`,{waitUntil:'load',timeout:30000}).catch(()=>{});
// force reveal + set hero slideshow bg + neutralize animations
await p.addStyleTag({content:`
  *{animation:none !important; transition:none !important;}
  .elementor-invisible{opacity:1 !important; transform:none !important;}
  .elementskit-image-comparison img{position:relative !important; clip:auto !important;}
`});
await p.evaluate(()=>{
  // hero slideshow: apply first gallery image as section background
  document.querySelectorAll('[data-settings]').forEach(el=>{
    try{ const s=JSON.parse(el.getAttribute('data-settings')); if(s.background_background==='slideshow' && s.background_slideshow_gallery?.length){ const url=s.background_slideshow_gallery[0].url.replace('https://balgadesigns.com.au',''); el.style.backgroundImage=`url('${url}')`; el.style.backgroundSize='cover'; el.style.backgroundPosition='center'; } }catch(e){}
  });
  // before/after: show only first image cleanly
  document.querySelectorAll('.elementskit-image-comparison').forEach(c=>{ const imgs=c.querySelectorAll('img'); imgs.forEach((im,i)=>{ im.style.position='relative'; im.style.width='100%'; im.style.height='auto'; if(i>0) im.style.display='none'; }); });
});
await p.waitForTimeout(400);
await p.evaluate(async()=>{ await new Promise(r=>{let y=0;const s=()=>{scrollBy(0,700);y+=700;if(y<document.body.scrollHeight)setTimeout(s,25);else r();};s();}); });
await p.waitForTimeout(800);
await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
await p.screenshot({path:'qa/reference/home-desktop-live.png',fullPage:true});
const m=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.body.scrollHeight}));
console.log('live ref captured', m);
await b.close(); srv.close();

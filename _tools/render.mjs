import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve('_audit/mirror');
const OUT = path.resolve('_audit');
fs.mkdirSync(path.join(OUT,'shots'), { recursive:true });

const ROUTES = [
  'home','about','services','projects','pricing','blog','contact',
  'article-native-gardens','article-designing-planning','article-balga-meaning'
];

const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml',
  '.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject',
  '.json':'application/json','.ico':'image/x-icon','.mp4':'video/mp4','.webm':'video/webm' };

const srv = http.createServer((req,res)=>{
  let u = decodeURIComponent(req.url.split('?')[0]);
  let fp;
  if (u.startsWith('/page/')) fp = path.join(ROOT,'pages', u.slice('/page/'.length) + '.html');
  else { if (u.endsWith('/')) u += 'index.html'; fp = path.join(ROOT, u); }
  fs.readFile(fp, (err,buf)=>{
    if (err){ res.statusCode=404; res.end('nf'); return; }
    res.setHeader('content-type', MIME[path.extname(fp).toLowerCase()]||'application/octet-stream');
    res.end(buf);
  });
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const PORT = srv.address().port;
const BASE = `http://127.0.0.1:${PORT}`;
console.log('serving on', BASE);

const REP = `(() => {
  const seen = {};
  const grab = (sel, key) => { const el = document.querySelector(sel); if (!el) return;
    const cs = getComputedStyle(el);
    seen[key] = { selector: sel, text:(el.textContent||'').trim().slice(0,60),
      fontFamily:cs.fontFamily, fontSize:cs.fontSize, fontWeight:cs.fontWeight, lineHeight:cs.lineHeight,
      letterSpacing:cs.letterSpacing, textTransform:cs.textTransform, color:cs.color, backgroundColor:cs.backgroundColor,
      padding:cs.padding, margin:cs.margin, borderRadius:cs.borderRadius, boxShadow:cs.boxShadow, borderColor:cs.borderColor,
      width:cs.width, maxWidth:cs.maxWidth }; };
  grab('h1','h1'); grab('h2','h2'); grab('h3','h3'); grab('h4','h4'); grab('p','p');
  grab('header a, nav a','navLink');
  grab('.elementor-button','button'); grab('label','label');
  grab('input[type=text],input[type=email],input,textarea','input');
  grab('footer','footer'); grab('footer h1,footer h2,footer h3,footer h4','footerHeading');
  grab('body','body');
  return seen;
})()`;

async function extract(page){
  return await page.evaluate(() => {
    const cssVars = {};
    for (const sheet of Array.from(document.styleSheets)){
      let rules; try{ rules=sheet.cssRules; }catch(e){ continue; } if(!rules) continue;
      for (const rule of Array.from(rules)){
        if (rule.selectorText === ':root' && rule.style){
          for (const p of Array.from(rule.style)) if (p.startsWith('--')) cssVars[p]=rule.style.getPropertyValue(p).trim();
        }
      }
    }
    const fonts=[]; try{ document.fonts.forEach(f=>fonts.push({family:f.family,weight:f.weight,style:f.style,status:f.status})); }catch(e){}
    const images = Array.from(document.querySelectorAll('img')).map(img=>({src:(img.currentSrc||img.src||'').replace(location.origin,''),srcset:img.getAttribute('srcset')||'',sizes:img.sizes||'',alt:img.alt||'',nw:img.naturalWidth,nh:img.naturalHeight,dw:Math.round(img.getBoundingClientRect().width),dh:Math.round(img.getBoundingClientRect().height),loading:img.loading||'',cls:(img.className||'').toString().slice(0,50)}));
    const header = document.querySelector('header') || document.querySelector('.elementor-location-header') || document.querySelector('[data-elementor-type=header]');
    const headerH = header ? Math.round(header.getBoundingClientRect().height) : null;
    const navLinks = Array.from(document.querySelectorAll('header a, .elementor-location-header a')).map(a=>({t:(a.textContent||'').trim(),href:(a.getAttribute('href')||'')})).filter(a=>a.t);
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    return { cssVars, fonts, images, headerH, navLinks, bodyBg };
  });
}

const results = {};
const b = await chromium.launch({ args:['--no-sandbox'] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1 });
const page = await ctx.newPage();
const consoleErrs = {};
for (const slug of ROUTES){
  const errs=[]; page.removeAllListeners('console');
  page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,140)); });
  await page.goto(`${BASE}/page/${slug}`, { waitUntil:'load', timeout:30000 }).catch(e=>console.error('goto',slug,e.message));
  await page.waitForTimeout(500);
  await page.evaluate(async()=>{ await new Promise(res=>{ let y=0; const s=()=>{window.scrollBy(0,700);y+=700; if(y<document.body.scrollHeight)setTimeout(s,40); else res();}; s(); }); });
  await page.waitForTimeout(800);
  await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(300);
  results[slug] = { ...await extract(page), representative: await page.evaluate(REP) };
  consoleErrs[slug]=errs;
  await page.screenshot({ path: path.join(OUT,'shots', slug+'-desktop.png'), fullPage:true });
  console.log('desktop', slug, 'imgs', results[slug].images.length, 'headerH', results[slug].headerH, 'vars', Object.keys(results[slug].cssVars).length);
}

// mobile
const mctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const mp = await mctx.newPage();
for (const slug of ROUTES){
  await mp.goto(`${BASE}/page/${slug}`, { waitUntil:'load', timeout:30000 }).catch(()=>{});
  await mp.waitForTimeout(400);
  await mp.evaluate(async()=>{ await new Promise(res=>{ let y=0; const s=()=>{window.scrollBy(0,700);y+=700; if(y<document.body.scrollHeight)setTimeout(s,30); else res();}; s(); }); });
  await mp.waitForTimeout(500);
  await mp.evaluate(()=>window.scrollTo(0,0));
  const mh = await mp.evaluate(()=>{ const h=document.querySelector('header')||document.querySelector('.elementor-location-header'); return h?Math.round(h.getBoundingClientRect().height):null; });
  if(results[slug]) results[slug].mobileHeaderH = mh;
  await mp.screenshot({ path: path.join(OUT,'shots', slug+'-mobile.png'), fullPage:true });
  console.log('mobile', slug, 'headerH', mh);
}

fs.writeFileSync(path.join(OUT,'render-audit.json'), JSON.stringify(results,null,2));
fs.writeFileSync(path.join(OUT,'console-errors.json'), JSON.stringify(consoleErrs,null,2));
await b.close(); srv.close();
console.log('RENDER DONE');

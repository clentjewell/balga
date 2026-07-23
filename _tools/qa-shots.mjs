import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='qa/rebuild'; fs.mkdirSync(OUT,{recursive:true});
const BASE='http://127.0.0.1:4321';
const routes=[['home','/'],['about','/about/'],['services','/services/'],['projects','/projects/'],['pricing','/pricing/'],['blog','/balga-blog/'],['contact','/contact/'],['article-native-gardens','/what-are-native-gardens/'],['article-designing-planning','/why-designing-and-planning-are-crucial-for-successful-landscaping/'],['article-balga-meaning','/balga-meaning-purpose/'],['404','/no-such-page/']];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
// desktop
const d=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})).newPage();
for(const [s,u] of routes){ await d.goto(BASE+u,{waitUntil:'load',timeout:30000}).catch(()=>{}); await d.evaluate(async()=>{await new Promise(r=>{let y=0;const st=()=>{scrollBy(0,800);y+=800;if(y<document.body.scrollHeight)setTimeout(st,25);else r();};st();});}); await d.waitForTimeout(500); await d.evaluate(()=>scrollTo(0,0)); await d.waitForTimeout(300); await d.screenshot({path:`${OUT}/${s}-desktop.png`,fullPage:true}); console.log('d',s); }
// mobile
const m=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();
for(const [s,u] of routes){ await m.goto(BASE+u,{waitUntil:'load',timeout:30000}).catch(()=>{}); await m.evaluate(async()=>{await new Promise(r=>{let y=0;const st=()=>{scrollBy(0,800);y+=800;if(y<document.body.scrollHeight)setTimeout(st,20);else r();};st();});}); await m.waitForTimeout(400); await m.evaluate(()=>scrollTo(0,0)); await m.screenshot({path:`${OUT}/${s}-mobile.png`,fullPage:true}); console.log('m',s); }
await b.close();

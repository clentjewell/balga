import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})).newPage();
await p.goto('http://127.0.0.1:4321/',{waitUntil:'load'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const s=()=>{scrollBy(0,700);y+=700;if(y<document.body.scrollHeight)setTimeout(s,25);else r();};s();});});
await p.waitForTimeout(600); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
await p.screenshot({path:'qa/rebuild/home-desktop.png',fullPage:true});
console.log('shot done');
await b.close();

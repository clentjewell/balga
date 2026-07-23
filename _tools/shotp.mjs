import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'});
for(const [s,u] of [['services','/services/'],['pricing','/pricing/']]){
  const p=await ctx.newPage();
  await p.goto('http://127.0.0.1:4321'+u,{waitUntil:'load'});
  await p.evaluate(async()=>{await new Promise(r=>{let y=0;const st=()=>{scrollBy(0,800);y+=800;if(y<document.body.scrollHeight)setTimeout(st,25);else r();};st();});});
  await p.waitForTimeout(600); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(300);
  await p.screenshot({path:`qa/rebuild/${s}-desktop.png`,fullPage:true}); console.log('shot',s); await p.close();
}
await b.close();

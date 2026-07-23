import { chromium } from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:412,height:900}})).newPage();
await p.goto('http://127.0.0.1:4321/services/',{waitUntil:'load'});
const wide=await p.evaluate(()=>{
  const vw=document.documentElement.clientWidth; const out=[];
  document.querySelectorAll('*').forEach(el=>{const r=el.getBoundingClientRect(); if(r.right>vw+1||r.width>vw+1){out.push({tag:el.tagName,cls:(el.className||'').toString().slice(0,40),w:Math.round(r.width),right:Math.round(r.right)});}});
  return out.slice(0,12);
});
console.log(JSON.stringify(wide,null,1));
await b.close();

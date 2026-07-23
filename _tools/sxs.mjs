import sharp from 'sharp'; import fs from 'node:fs';
const OUT='qa/sxs'; fs.mkdirSync(OUT,{recursive:true});
const live='qa/reference/home-desktop-live.png', reb='qa/rebuild/home-desktop.png';
const CW=520; // column width
const lm=await sharp(live).metadata(), rm=await sharp(reb).metadata();
// scale both to CW width
const lS=CW/lm.width, rS=CW/rm.width;
const lH=Math.round(lm.height*lS), rH=Math.round(rm.height*rS);
const lImg=await sharp(live).resize({width:CW}).toBuffer();
const rImg=await sharp(reb).resize({width:CW}).toBuffer();
const H=Math.max(lH,rH)+30;
const label=(t,w)=>Buffer.from(`<svg width="${w}" height="30"><rect width="100%" height="100%" fill="#5a674e"/><text x="10" y="20" font-family="sans-serif" font-size="15" fill="#fff">${t}</text></svg>`);
await sharp({create:{width:CW*2+20,height:H,channels:4,background:{r:240,g:240,b:238,alpha:1}}}).composite([
  {input:label('LIVE',CW),top:0,left:0},
  {input:lImg,top:30,left:0},
  {input:label('REBUILD',CW),top:0,left:CW+20},
  {input:rImg,top:30,left:CW+20},
]).png().toFile(`${OUT}/home-full.png`);
// also slice into 4 vertical bands for readable viewing
const total=H; const bands=5; const per=Math.ceil(total/bands);
for(let i=0;i<bands;i++){ const top=i*per; const h=Math.min(per,total-top); if(h<=0)break; await sharp(`${OUT}/home-full.png`).extract({left:0,top,width:CW*2+20,height:h}).toFile(`${OUT}/band-${i}.png`); }
console.log('sxs done, live',lm.width+'x'+lm.height,'rebuild',rm.width+'x'+rm.height);

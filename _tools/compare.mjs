import sharp from 'sharp'; import fs from 'node:fs';
const W=680;
async function cropTop(src, px){ const m=await sharp(src).metadata(); const h=Math.min(px, m.height); return await sharp(src).extract({left:0,top:0,width:m.width,height:h}).resize({width:W}).toBuffer(); }
function label(text){ const svg=`<svg width="${W}" height="40"><rect width="100%" height="100%" fill="#5a674e"/><text x="16" y="26" font-family="sans-serif" font-size="18" fill="#fff">${text}</text></svg>`; return Buffer.from(svg); }
const ref=await cropTop('qa/reference/home-desktop.png', 800);
const reb=await cropTop('qa/rebuild/home-desktop.png', 800);
const rm=await sharp(ref).metadata(); const bm=await sharp(reb).metadata();
const H=Math.max(rm.height,bm.height)+40;
const canvas=sharp({create:{width:W*2+30,height:H,channels:4,background:{r:255,g:255,b:255,alpha:1}}});
const out=await canvas.composite([
  {input:label('LIVE (captured reference)'),top:0,left:0},
  {input:ref,top:40,left:0},
  {input:label('REBUILD (workers.dev)'),top:0,left:W+30},
  {input:reb,top:40,left:W+30},
]).png().toFile('qa/home-hero-compare.png');
console.log('wrote qa/home-hero-compare.png');

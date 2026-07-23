import sharp from 'sharp'; import fs from 'node:fs';
const slug=process.argv[2]; const OUT=`qa/sxs`; fs.mkdirSync(OUT,{recursive:true});
const live=`qa/reference/${slug}-live.png`, reb=`qa/rebuild/${slug}-desktop.png`;
const CW=520;
const lImg=await sharp(live).resize({width:CW}).toBuffer();
const rImg=await sharp(reb).resize({width:CW}).toBuffer();
const lH=(await sharp(lImg).metadata()).height, rH=(await sharp(rImg).metadata()).height;
const H=Math.max(lH,rH)+30;
const label=(t)=>Buffer.from(`<svg width="${CW}" height="30"><rect width="100%" height="100%" fill="#5a674e"/><text x="10" y="20" font-family="sans-serif" font-size="15" fill="#fff">${t}</text></svg>`);
await sharp({create:{width:CW*2+20,height:H,channels:4,background:{r:238,g:238,b:236,alpha:1}}}).composite([
  {input:label('LIVE'),top:0,left:0},{input:lImg,top:30,left:0},
  {input:label('REBUILD'),top:0,left:CW+20},{input:rImg,top:30,left:CW+20},
]).png().toFile(`${OUT}/${slug}-full.png`);
// slice into bands
const bands=Math.ceil(H/1150);
for(let i=0;i<bands;i++){const top=i*1150;const h=Math.min(1150,H-top);if(h<=0)break;await sharp(`${OUT}/${slug}-full.png`).extract({left:0,top,width:CW*2+20,height:h}).toFile(`${OUT}/${slug}-b${i}.png`);}
console.log(slug,'bands',bands,'liveH',lH,'rebH',rH);

import sharp from 'sharp'; import fs from 'node:fs';
const OUT='qa/liveslices'; fs.mkdirSync(OUT,{recursive:true});
const src='qa/reference/home-desktop-live.png'; const W=760, BAND=1150;
const m=await sharp(src).metadata(); const scale=W/m.width; const per=Math.round(BAND/scale);
const n=Math.ceil(m.height/per);
for(let i=0;i<n;i++){const top=i*per;const h=Math.min(per,m.height-top);if(h<=0)break;await sharp(src).extract({left:0,top,width:m.width,height:h}).resize({width:W}).toFile(`${OUT}/${String(i).padStart(2,'0')}.png`);}
console.log('live slices',n);

import sharp from 'sharp';
import fs from 'node:fs';
const OUT='_audit/slices'; fs.mkdirSync(OUT,{recursive:true});
const jobs = process.argv.slice(2); // list of shot basenames
const BAND = 1200, W = 780;
for (const name of jobs){
  const src = `_audit/shots/${name}.png`;
  const meta = await sharp(src).metadata();
  const scale = W/meta.width;
  const n = Math.ceil(meta.height/ (BAND/scale));
  for (let i=0;i<n;i++){
    const top = Math.round(i*BAND/scale);
    const h = Math.min(Math.round(BAND/scale), meta.height-top);
    if (h<=0) break;
    await sharp(src).extract({left:0,top,width:meta.width,height:h}).resize({width:W}).png({quality:70}).toFile(`${OUT}/${name}-${String(i).padStart(2,'0')}.png`);
  }
  console.log(name, 'sliced into', n, 'bands', meta.width+'x'+meta.height);
}

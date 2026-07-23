import sharp from 'sharp'; import fs from 'node:fs';
const OUT='qa/slices'; fs.mkdirSync(OUT,{recursive:true});
const W=760, BAND=1150;
for(const name of process.argv.slice(2)){
  const src=`qa/rebuild/${name}.png`;
  const meta=await sharp(src).metadata(); const scale=W/meta.width; const per=Math.round(BAND/scale);
  const n=Math.ceil(meta.height/per);
  for(let i=0;i<n;i++){const top=i*per;const h=Math.min(per,meta.height-top);if(h<=0)break;await sharp(src).extract({left:0,top,width:meta.width,height:h}).resize({width:W}).png().toFile(`${OUT}/${name}-${String(i).padStart(2,'0')}.png`);}
  console.log(name,n,'bands',meta.width+'x'+meta.height);
}

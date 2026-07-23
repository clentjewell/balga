import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au';
fs.mkdirSync('public/assets/home/hero',{recursive:true});
const hero=[
  ['balga-designs-garden.jpeg','/wp-content/uploads/2024/09/Balga-Designs-Garden-scaled.jpeg'],
  ['balga-designs.jpeg','/wp-content/uploads/2024/09/Blaga-Designs-scaled.jpeg'],
  ['balga-design-work.jpeg','/wp-content/uploads/2024/09/Balga-Design-work.jpeg'],
];
for(const [name,path] of hero){
  const buf=Buffer.from(await (await fetch(B+path)).arrayBuffer());
  let img=sharp(buf); const m=await img.metadata();
  if(m.width>1920) img=img.resize({width:1920});
  await img.jpeg({quality:80,mozjpeg:true}).toFile('public/assets/home/hero/'+name);
  const nm=await sharp('public/assets/home/hero/'+name).metadata();
  console.log('hero',name,nm.width+'x'+nm.height, fs.statSync('public/assets/home/hero/'+name).size);
}

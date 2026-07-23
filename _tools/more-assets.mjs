import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au';
const jobs=[
  ['home/margarida.jpg','/wp-content/uploads/2024/09/Margarida.jpg',1200,'jpg'],
  ['home/cta-start-project.webp','/wp-content/uploads/2024/09/start-project-with-balga-designs-scaled.webp',1920,'webp'],
  ['home/line4.png','/wp-content/uploads/2024/08/line4.png',1200,'png'],
];
for(const [dest,path,cap,fmt] of jobs){
  const fp='public/assets/'+dest; fs.mkdirSync('public/assets/home',{recursive:true});
  const buf=Buffer.from(await (await fetch(B+path)).arrayBuffer());
  let img=sharp(buf); const m=await img.metadata();
  if(m.width>cap) img=img.resize({width:cap});
  if(fmt==='jpg') await img.jpeg({quality:82,mozjpeg:true}).toFile(fp);
  else if(fmt==='webp') await img.webp({quality:80}).toFile(fp);
  else await img.png({compressionLevel:9}).toFile(fp);
  const nm=await sharp(fp).metadata();
  console.log(dest, nm.width+'x'+nm.height, nm.hasAlpha?'(alpha)':'', fs.statSync(fp).size);
}

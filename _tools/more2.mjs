import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au';
const jobs=[
  ['home/testimonials-bg.webp','/wp-content/uploads/2024/09/Naturalistic-Garden.webp',1920,'webp'],
  ['pricing/faqs-bg.jpg','/wp-content/uploads/2025/05/FAQs-2.jpg',1920,'jpg'],
  ['pricing/cta-footer.png','/wp-content/uploads/2025/05/footer.png',1920,'png'],
];
for(const [dest,p,cap,fmt] of jobs){
  const fp='public/assets/'+dest; fs.mkdirSync(fp.substring(0,fp.lastIndexOf('/')),{recursive:true});
  const buf=Buffer.from(await (await fetch(B+p)).arrayBuffer());
  let img=sharp(buf); const m=await img.metadata(); if(m.width>cap) img=img.resize({width:cap});
  if(fmt==='webp') await img.webp({quality:80}).toFile(fp);
  else if(fmt==='png') await img.png({compressionLevel:9}).toFile(fp);
  else await img.jpeg({quality:82,mozjpeg:true}).toFile(fp);
  console.log(dest,(await sharp(fp).metadata()).width, fs.statSync(fp).size);
}

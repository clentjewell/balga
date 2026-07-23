import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au';
const jobs=[
  ['services/hero.jpg','/wp-content/uploads/2025/04/IMG_6414-scaled.jpg'],
  ['projects/hero.jpeg','/wp-content/uploads/2025/04/IMG_5976-scaled.jpeg'],
  ['pricing/hero.jpg','/wp-content/uploads/2025/05/header-1.jpg'],
  ['about/hero.jpeg','/wp-content/uploads/2024/09/Balga-Designs-Portfolio-scaled.jpeg'],
  ['blog/articles-header.webp','/wp-content/uploads/2025/05/Articles-header-.webp'],
];
for(const [dest,p] of jobs){
  const fp='public/assets/'+dest; fs.mkdirSync(fp.substring(0,fp.lastIndexOf('/')),{recursive:true});
  const buf=Buffer.from(await (await fetch(B+p)).arrayBuffer());
  let img=sharp(buf); const m=await img.metadata(); if(m.width>1920) img=img.resize({width:1920});
  const ext=dest.split('.').pop();
  if(ext==='webp') await img.webp({quality:80}).toFile(fp); else await img.jpeg({quality:82,mozjpeg:true}).toFile(fp);
  const nm=await sharp(fp).metadata();
  console.log(dest, nm.width+'x'+nm.height, fs.statSync(fp).size);
}

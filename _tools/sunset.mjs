import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au';
const buf=Buffer.from(await (await fetch(B+'/wp-content/uploads/2024/09/Sunset-at-balga-designs.jpg')).arrayBuffer());
let img=sharp(buf); const m=await img.metadata(); if(m.width>1920) img=img.resize({width:1920});
fs.mkdirSync('public/assets/home',{recursive:true});
await img.jpeg({quality:82,mozjpeg:true}).toFile('public/assets/home/sunset.jpg');
console.log('sunset', (await sharp('public/assets/home/sunset.jpg').metadata()).width, fs.statSync('public/assets/home/sunset.jpg').size);

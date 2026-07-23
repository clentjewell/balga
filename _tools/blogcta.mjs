import fs from 'node:fs'; import sharp from 'sharp';
const url='https://balgadesigns.com.au/wp-content/uploads/2025/04/Grass-Tree-Horizon-Landscape-KARINA-JAMBRAK-GICLEE-ART-PRINT-2.jpg.webp';
const buf=Buffer.from(await (await fetch(url)).arrayBuffer());
let img=sharp(buf); const m=await img.metadata(); if(m.width>1920) img=img.resize({width:1920});
fs.mkdirSync('public/assets/blog',{recursive:true});
await img.webp({quality:82}).toFile('public/assets/blog/cta-grass-tree.webp');
console.log('cta-grass-tree', (await sharp('public/assets/blog/cta-grass-tree.webp').metadata()).width, fs.statSync('public/assets/blog/cta-grass-tree.webp').size);

import sharp from 'sharp'; import fs from 'node:fs';
fs.mkdirSync('qa/id',{recursive:true});
const files=[['image-1','public/assets/home/feature-1.jpeg'],['image-2','public/assets/home/feature-2.jpeg'],['hero-garden','public/assets/home/hero/balga-designs-garden.jpeg'],['hero-work','public/assets/home/hero/balga-design-work.jpeg'],['hero-designs','public/assets/home/hero/balga-designs.jpeg']];
const insets=[];
for(const [n,f] of files){ if(!fs.existsSync(f))continue; await sharp(f).resize(300,220,{fit:'cover'}).png().toFile('qa/id/'+n+'.png'); }
console.log('done');

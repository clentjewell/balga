import fs from 'node:fs'; import sharp from 'sharp';
const B='https://balgadesigns.com.au/wp-content/uploads/2024/08/Balga-Designs_Favicon.png';
const buf=Buffer.from(await (await fetch(B)).arrayBuffer());
fs.mkdirSync('public/assets/branding',{recursive:true});
fs.writeFileSync('public/assets/branding/favicon-source.png', buf);
const meta=await sharp(buf).metadata();
console.log('source favicon', meta.width+'x'+meta.height, buf.length,'bytes');
// generate sized PNGs
for(const s of [32,180,192,512]){
  await sharp(buf).resize(s,s,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(`public/assets/branding/favicon-${s}.png`);
}
// 32x32 ico (single size png-in-ico via sharp? sharp has no ico; write 32 png as favicon.ico fallback)
await sharp(buf).resize(32,32,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile('public/favicon.ico');
console.log('generated favicon-32/180/192/512 + public/favicon.ico');

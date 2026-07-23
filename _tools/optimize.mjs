import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve('public/assets');
// caps by folder (max width). Transparency-critical stay png.
const CAP = (rel) => {
  if (rel.startsWith('branding/')) return 1144;
  if (rel.startsWith('icons/')) return 400;
  if (rel.startsWith('services/')) return 1000;
  if (rel.startsWith('pricing/')) return 900;
  if (rel.startsWith('projects/')) return 1600;
  if (rel.startsWith('home/')) return 1400;
  if (rel.startsWith('about/')) return 1400;
  if (rel.startsWith('blog/')) return 1400;
  return 1600;
};
function walk(dir){ let out=[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) out=out.concat(walk(p)); else out.push(p);} return out; }
const dims={};
for(const fp of walk(ROOT)){
  const rel=path.relative(ROOT,fp).split(path.sep).join('/');
  const ext=path.extname(fp).toLowerCase();
  if(!['.jpg','.jpeg','.png','.webp'].includes(ext)) continue;
  try{
    let img=sharp(fp,{failOn:'none'});
    let meta=await img.metadata();
    const cap=CAP(rel);
    const before=fs.statSync(fp).size;
    let pipeline=sharp(fp,{failOn:'none'});
    if(meta.width>cap) pipeline=pipeline.resize({width:cap,withoutEnlargement:true});
    const hasAlpha=meta.hasAlpha;
    let buf;
    if(ext==='.png'){
      // keep png if has alpha (logos/icons); recompress
      if(hasAlpha) buf=await pipeline.png({compressionLevel:9,palette:true,quality:90}).toBuffer();
      else buf=await pipeline.png({compressionLevel:9}).toBuffer();
    } else if(ext==='.webp'){
      buf=await pipeline.webp({quality:82}).toBuffer();
    } else {
      buf=await pipeline.jpeg({quality:82,mozjpeg:true}).toBuffer();
    }
    if(buf.length<before || meta.width>cap) fs.writeFileSync(fp,buf);
    const nm=await sharp(fp).metadata();
    dims['/assets/'+rel]={w:nm.width,h:nm.height,bytes:fs.statSync(fp).size};
  }catch(e){ console.error('opt fail',rel,e.message); }
}
fs.writeFileSync(path.resolve('audit/asset-dimensions.json'), JSON.stringify(dims,null,2));
let total=0; for(const k in dims) total+=dims[k].bytes;
console.log('optimized',Object.keys(dims).length,'files, total',(total/1048576).toFixed(1),'MB');

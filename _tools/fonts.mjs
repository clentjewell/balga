import fs from 'node:fs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const css = await (await fetch('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',{headers:{'User-Agent':UA}})).text();
// parse blocks: capture font-weight + latin (U+0000-00FF) url
const blocks = css.split('@font-face').slice(1);
const want={};
for(const b of blocks){
  const w=(b.match(/font-weight:\s*(\d+)/)||[])[1];
  const isLatin=/U\+0000-00FF/.test(b);
  const url=(b.match(/url\((https:[^)]+\.woff2)\)/)||[])[1];
  if(w&&isLatin&&url&&['400','500','600','700'].includes(w)) want[w]=url;
}
for(const [w,url] of Object.entries(want)){
  const buf=Buffer.from(await (await fetch(url,{headers:{'User-Agent':UA}})).arrayBuffer());
  fs.writeFileSync(`public/fonts/montserrat-${w}.woff2`, buf);
  console.log('font',w,buf.length,'bytes');
}

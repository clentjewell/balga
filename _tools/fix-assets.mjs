import fs from 'node:fs'; import path from 'node:path';
const B='https://balgadesigns.com.au';
async function tryUrls(urls){ for(const u of urls){ try{ const r=await fetch(u); if(r.ok){ const b=Buffer.from(await r.arrayBuffer()); if(b.length>2000) return {u,b}; } }catch(e){} } return null; }
// Why-Designing-3: use largest resized
const w = await tryUrls([
  B+'/wp-content/uploads/2025/05/Why-Designing-3--2048x1657.jpg',
  B+'/wp-content/uploads/2025/05/Why-Designing-3--1536x1243.jpg',
]);
if(w){ fs.writeFileSync('public/assets/blog/designing-planning/why-designing-3.jpg', w.b); console.log('why-designing-3 OK from',w.u,w.b.length); }
// decorative plants: try thumb (encoded) + original screenshot locations
const d = await tryUrls([
  B+'/wp-content/uploads/elementor/thumbs/'+encodeURIComponent('Screenshot-2025-04-24-at-3.40.27 pm-r4teqcyyilkzcze865x8ovah1lnr8waw5eyl0hc4zw.png'),
  B+encodeURI('/wp-content/uploads/2025/04/Screenshot-2025-04-24-at-3.40.27 pm.png'),
  B+encodeURI('/wp-content/uploads/2025/05/Screenshot-2025-04-24-at-3.40.27 pm.png'),
  B+'/wp-content/uploads/2025/04/Screenshot-2025-04-24-at-3.40.27%E2%80%AFpm.png',
]);
if(d){ fs.writeFileSync('public/assets/services/decorative-plants.png', d.b); console.log('decorative-plants OK from',d.u,d.b.length); }
else console.log('decorative-plants STILL MISSING');

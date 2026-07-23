const B="https://balga-designs-preview.clent.workers.dev";
await new Promise(r=>setTimeout(r,3000));
const checks={
  "/":[["hero slideshow","hero/balga-designs-garden"],["margarida why-band","home/margarida.jpg"],["about imgs","home/feature-1.jpeg"],["CTA start-project","cta-start-project.webp"]],
  "/about/":[["hero portfolio","about/hero.jpeg"],["fire+evening","about/fire.jpg"],["sunset videoband","home/sunset.jpg"],["testimonials bg","testimonials-bg.webp"],["CTA start-project","cta-start-project.webp"],["no margarida","!home/margarida.jpg"]],
  "/services/":[["hero","services/hero.jpg"],["margarida","home/margarida.jpg"],["testimonials bg","testimonials-bg.webp"]],
  "/projects/":[["hero","projects/hero.jpeg"],["sunset videoband","home/sunset.jpg"],["no margarida","!home/margarida.jpg"]],
  "/pricing/":[["hero header-1","pricing/hero.jpg"],["sunset videoband","home/sunset.jpg"],["faqs bg","pricing/faqs-bg.jpg"],["cta footer","pricing/cta-footer.png"],["testimonials bg","testimonials-bg.webp"]],
  "/balga-blog/":[["hero newrybar","blog/balga-meaning.jpg"]],
  "/contact/":[["hero garden","hero/balga-designs-garden"]],
};
let fail=0;
for(const [path,list] of Object.entries(checks)){
  const html=await (await fetch(B+path,{cache:"no-store"})).text();
  const parts=[];
  for(const [label,token] of list){
    const neg=token.startsWith("!"); const t=neg?token.slice(1):token;
    const present=html.includes(t);
    const ok=neg?!present:present;
    if(!ok)fail++;
    parts.push((ok?"✓":"✗")+" "+label);
  }
  console.log(path+"\n   "+parts.join("  "));
}
console.log(fail===0?"\n✅ ALL PAGE IMAGES MATCH LIVE MAP":"\n❌ "+fail+" mismatch");

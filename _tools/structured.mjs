import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';
const HTMLDIR = path.resolve('_audit/html');
const ROUTES = ['home','about','services','projects','pricing','blog','contact','article-native-gardens','article-designing-planning','article-balga-meaning'];
const T = s => (s||'').replace(/\s+/g,' ').trim();
const strip = u => (u||'').replace(/https?:\/\/balgadesigns\.com\.au/,'');
const out = {};
for (const slug of ROUTES){
  const root = parse(fs.readFileSync(path.join(HTMLDIR, slug+'.html'),'utf8'));
  // FAQ
  const faqs = [];
  root.querySelectorAll('.elementskit-card').forEach(card=>{
    const q = T(card.querySelector('.elementskit-card-header')?.text);
    const a = T(card.querySelector('.elementskit-card-body')?.text);
    if (q) faqs.push({ q, a });
  });
  // Testimonials (elementskit / elementor testimonial)
  const testis = [];
  root.querySelectorAll('.elementor-testimonial, .elementskit-testimonial-slider .swiper-slide, .elementor-widget-testimonial-carousel .swiper-slide, .ekit-testimonial--content').forEach(t=>{
    const text = T(t.querySelector('.elementor-testimonial__text, .elementor-testimonial-content, p')?.text || t.text);
    const name = T(t.querySelector('.elementor-testimonial__name, .elementor-testimonial-name, cite, .elementskit-commentor-name, .ekit-testimonial--title')?.text);
    if (text && text.length>40) testis.push({ text, name });
  });
  // Counters
  const counters = [];
  root.querySelectorAll('.elementor-counter').forEach(c=>{
    const num = c.querySelector('.elementor-counter-number');
    counters.push({
      start: num?.getAttribute('data-duration')?null:null,
      to: num?.getAttribute('data-to-value') || num?.getAttribute('data-duration') || '',
      value: num?.getAttribute('data-to-value')||'',
      prefix: T(c.querySelector('.elementor-counter-number-prefix')?.text),
      suffix: T(c.querySelector('.elementor-counter-number-suffix')?.text),
      title: T(c.querySelector('.elementor-counter-title')?.text),
    });
  });
  // nav menu links
  const nav = [];
  root.querySelectorAll('.ekit-nav-menu li a, nav.elementor-nav-menu--main a, .elementor-nav-menu a').forEach(a=>{
    const t=T(a.text); if(t) nav.push({t, href: a.getAttribute('href')});
  });
  out[slug] = { faqs, testimonials: testis, counters, nav: [...new Map(nav.map(n=>[n.t,n])).values()] };
}
fs.writeFileSync(path.resolve('_audit/structured.json'), JSON.stringify(out,null,2));
for(const s of ROUTES) console.log(s,'faq',out[s].faqs.length,'testi',out[s].testimonials.length,'counters',out[s].counters.length,'nav',out[s].nav.length);

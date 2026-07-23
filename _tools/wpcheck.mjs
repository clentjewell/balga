const BASE="https://balga-designs-preview.clent.workers.dev";
const routes=["/","/about/","/services/","/projects/","/pricing/","/balga-blog/","/contact/","/what-are-native-gardens/"];
let wpDeps=0, emails=0, hotlinks=0;
for(const p of routes){
  const html=await (await fetch(BASE+p)).text();
  wpDeps += (html.match(/wp-content|wp-includes|elementor|\/wp-json|wp-emoji/gi)||[]).length;
  emails += (html.match(/info@balgadesigns\.com\.au/gi)||[]).length;
  const hl = html.match(/https?:\/\/balgadesigns\.com\.au\/[^"'\s)]+\.(?:jpg|jpeg|png|webp|css|js|svg)/gi)||[];
  if(hl.length){ hotlinks+=hl.length; console.log("HOTLINK on",p,hl.slice(0,3)); }
}
console.log("wp asset/dep references:",wpDeps);
console.log("hotlinked WP media:",hotlinks);
console.log("client email mentions (expected):",emails);

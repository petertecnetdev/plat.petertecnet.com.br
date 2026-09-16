const fs = require("fs");
const path = require("path");
const SITE_URL = "https://plat.petertecnet.com.br";
const API_URL = "https://api.petertecnet.com.br/api/v1/apps/plat/establishments?per_page=1000";
const PUBLIC_ROOT = path.join(process.cwd(), "public");
const BUILD_ROOT = path.join(process.cwd(), "build");
const OUT = path.join(BUILD_ROOT, "sitemap.xml");
const TODAY = new Date().toISOString().slice(0, 10);
const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[char]));
const discoverStaticLandingRoutes = () => !fs.existsSync(PUBLIC_ROOT) ? [] : fs.readdirSync(PUBLIC_ROOT,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>{const indexPath=path.join(PUBLIC_ROOT,e.name,"index.html"); if(!fs.existsSync(indexPath)) return null; const html=fs.readFileSync(indexPath,"utf8"); if(/noindex/i.test(html)) return null; return {loc:`${SITE_URL}/${encodeURIComponent(e.name)}/`,priority:"0.95",changefreq:"weekly",lastmod:TODAY};}).filter(Boolean);
async function main(){
 const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),6000); let restaurants=[];
 try{const response=await fetch(API_URL,{signal:controller.signal,headers:{Accept:"application/json","X-Peter-App":"plat","X-App-ID":"5"}}); if(!response.ok) throw new Error(`HTTP ${response.status}`); const payload=await response.json(); const body=payload?.data||payload||{}; restaurants=Array.isArray(body?.data)?body.data:Array.isArray(body)?body:[];}catch(error){console.warn(`[sitemap] API indisponível; mantendo rotas estáticas (${error.message}).`);}finally{clearTimeout(timeout);}
 const urls=[{loc:`${SITE_URL}/`,priority:"1.0",changefreq:"weekly",lastmod:TODAY},...discoverStaticLandingRoutes(),{loc:`${SITE_URL}/planos`,priority:"0.95",changefreq:"weekly",lastmod:TODAY},{loc:`${SITE_URL}/restaurants`,priority:"0.9",changefreq:"daily",lastmod:TODAY},...restaurants.filter(i=>i?.slug).map(i=>({loc:`${SITE_URL}/establishment/view/${encodeURIComponent(i.slug)}`,priority:"0.8",changefreq:"daily",lastmod:String(i.updated_at||i.created_at||TODAY).slice(0,10)}))];
 const unique=[...new Map(urls.map(e=>[e.loc,e])).values()]; const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(({loc,priority,changefreq,lastmod})=>`  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod||TODAY)}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
 fs.mkdirSync(path.dirname(OUT),{recursive:true}); fs.writeFileSync(OUT,xml,"utf8"); fs.writeFileSync(path.join(BUILD_ROOT,"robots.txt"),`User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /register\nDisallow: /password\nDisallow: /profile\nDisallow: /admin\nDisallow: /checkout\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,`utf8`); console.log(`[sitemap] ${unique.length} URLs públicas gravadas com lastmod.`);
}
main().catch(error=>{console.error("[sitemap] erro inesperado",error);process.exitCode=1;});

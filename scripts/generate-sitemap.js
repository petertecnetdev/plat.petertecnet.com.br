const fs = require("fs");
const path = require("path");

const SITE_URL = "https://plat.petertecnet.com.br";
const API_URL = "https://api.petertecnet.com.br/api/v1/apps/plat/establishments?per_page=1000";
const OUT = path.join(process.cwd(), "build", "sitemap.xml");

const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]));

async function main() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  let restaurants = [];

  try {
    const response = await fetch(API_URL, { signal: controller.signal, headers: { Accept: "application/json", "X-Peter-App": "plat", "X-App-ID": "5" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const body = payload?.data || payload || {};
    restaurants = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  } catch (error) {
    console.warn(`[sitemap] API indisponível; mantendo rotas estáticas (${error.message}).`);
  } finally {
    clearTimeout(timeout);
  }

  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "weekly" },
    { loc: `${SITE_URL}/restaurants`, priority: "0.9", changefreq: "daily" },
    ...restaurants.filter((item) => item?.slug).map((item) => ({ loc: `${SITE_URL}/establishment/view/${encodeURIComponent(item.slug)}`, priority: "0.8", changefreq: "daily" })),
  ];
  const unique = [...new Map(urls.map((entry) => [entry.loc, entry])).values()];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(({ loc, priority, changefreq }) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, xml, "utf8");
  console.log(`[sitemap] ${unique.length} URLs gravadas em build/sitemap.xml.`);
}

main().catch((error) => {
  console.error("[sitemap] erro inesperado", error);
  process.exitCode = 1;
});

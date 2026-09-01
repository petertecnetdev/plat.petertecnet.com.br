import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://plat.petertecnet.com.br";
const DEFAULT_TITLE = "Plat | Restaurantes, cardápios e atendimento";
const DEFAULT_DESCRIPTION = "Encontre restaurantes, veja cardápios e acompanhe experiências de atendimento pela Plat, uma plataforma Peter Tecnet.";

const PUBLIC = (path) => {
  if (path === "/") return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION };
  if (path === "/restaurants") return { title: "Restaurantes | Plat", description: "Descubra restaurantes e estabelecimentos disponíveis na Plat." };
  if (path.startsWith("/establishment/view/")) return { title: "Restaurante e cardápio | Plat", description: "Veja informações, cardápio e opções deste estabelecimento na Plat." };
  return null;
};

const PRIVATE = ["/dashboard", "/order/", "/user/", "/profile/", "/item/", "/establishment/create", "/establishment/update", "/establishment", "/service-record/", "/report/", "/login", "/register", "/password", "/email-verify", "/logout"];

function meta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
}
function canonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.rel = "canonical"; document.head.appendChild(el); }
  el.href = href;
}

export default function SeoManager() {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const route = PUBLIC(path);
    const indexable = Boolean(route) && !PRIVATE.some((prefix) => path === prefix || path.startsWith(prefix));
    const title = route?.title || DEFAULT_TITLE;
    const description = route?.description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;
    document.title = title;
    meta('meta[name="description"]', { name: "description", content: description });
    meta('meta[name="robots"]', { name: "robots", content: indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow" });
    meta('meta[property="og:title"]', { property: "og:title", content: title });
    meta('meta[property="og:description"]', { property: "og:description", content: description });
    meta('meta[property="og:url"]', { property: "og:url", content: url });
    meta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    canonical(url);
  }, [location.pathname]);
  return null;
}

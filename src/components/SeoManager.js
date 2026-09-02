import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { storageUrl } from "../config";
import { getOrdering } from "../services/platCommerceApi";

const SITE_URL = "https://plat.petertecnet.com.br";
const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`;
const DEFAULT_TITLE = "Plat | Restaurantes, cardápios e pedidos";
const DEFAULT_DESCRIPTION = "Descubra restaurantes, consulte cardápios, faça pedidos e acompanhe tudo pela Plat, uma plataforma Peter Tecnet.";

const ROUTES = [
  { test: (p) => p === "/", index: true, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  { test: (p) => p === "/restaurants", index: true, title: "Restaurantes e cardápios | Plat", description: "Encontre restaurantes na Plat, consulte cardápios e escolha onde fazer seu próximo pedido." },
  { test: (p) => p.startsWith("/establishment/view/"), index: true, title: "Restaurante e cardápio | Plat", description: "Veja o cardápio, informações e opções de pedido deste restaurante na Plat." },
  { test: (p) => p === "/login", title: "Entrar | Plat" },
  { test: (p) => p === "/register", title: "Criar conta | Plat" },
  { test: (p) => p === "/dashboard", title: "Painel | Plat" },
  { test: (p) => p.startsWith("/my-orders"), title: "Meus pedidos | Plat" },
  { test: (p) => p.startsWith("/order/"), title: "Pedidos do restaurante | Plat" },
  { test: (p) => p.startsWith("/item/"), title: "Itens e cardápio | Plat" },
  { test: (p) => p === "/establishment", title: "Estabelecimentos | Plat" },
  { test: (p) => p.startsWith("/establishment/"), title: "Gestão do estabelecimento | Plat" },
  { test: (p) => p.startsWith("/report/"), title: "Relatórios | Plat" },
  { test: (p) => p.startsWith("/service-record/"), title: "Atendimentos | Plat" },
  { test: (p) => p.startsWith("/user/"), title: "Conta e usuários | Plat" },
  { test: (p) => p.startsWith("/profile/"), title: "Perfis e permissões | Plat" },
  { test: (p) => p.startsWith("/password") || p === "/email-verify" || p === "/invite-complete", title: "Segurança da conta | Plat" },
  { test: () => true, title: "Página não encontrada | Plat" },
];

function upsertMeta(selector, attrs) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

function setJsonLd(value) {
  const id = "plat-route-structured-data";
  let script = document.getElementById(id);
  if (!value) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(value).replace(/</g, "\\u003c");
}

function imageUrl(value) {
  if (!value) return DEFAULT_IMAGE;
  const raw = String(value);
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${storageUrl}/${raw.replace(/^\//, "")}`;
}

function applySeo({ title, description = DEFAULT_DESCRIPTION, url, index = false, image = DEFAULT_IMAGE, type = "website", jsonLd = null }) {
  document.title = title;
  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[name="robots"]', { name: "robots", content: index ? "index, follow, max-image-preview:large, max-snippet:-1" : "noindex, nofollow, noarchive" });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
  upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: title });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
  setCanonical(url);
  setJsonLd(jsonLd);
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    let active = true;
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const route = ROUTES.find(({ test }) => test(path));
    const url = `${SITE_URL}${path === "/" ? "/" : path}`;

    applySeo({
      title: route?.title || DEFAULT_TITLE,
      description: route?.description || DEFAULT_DESCRIPTION,
      url,
      index: Boolean(route?.index),
      jsonLd: path === "/" ? {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Plat",
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@type": "Organization", name: "Peter Tecnet", url: "https://petertecnet.com.br" },
      } : null,
    });

    if (!path.startsWith("/establishment/view/")) return () => { active = false; };

    const slug = decodeURIComponent(path.slice("/establishment/view/".length));
    getOrdering(slug).then((data) => {
      if (!active || !data?.establishment) return;
      const establishment = data.establishment;
      const name = establishment.fantasy || establishment.name || "Restaurante";
      const locality = [establishment.city, establishment.uf].filter(Boolean).join(" - ");
      const description = String(establishment.description || `Veja o cardápio de ${name}${locality ? ` em ${locality}` : ""} e faça seu pedido pela Plat.`).replace(/\s+/g, " ").trim().slice(0, 180);
      const title = `${name}${locality ? ` em ${locality}` : ""} | Plat`;
      const image = imageUrl(establishment.background || establishment.logo);
      const address = establishment.address ? {
        "@type": "PostalAddress",
        streetAddress: establishment.address,
        addressLocality: establishment.city || undefined,
        addressRegion: establishment.uf || undefined,
        addressCountry: "BR",
      } : undefined;

      applySeo({
        title,
        description,
        url,
        index: true,
        image,
        type: "restaurant",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name,
          description,
          url,
          image,
          telephone: establishment.phone || undefined,
          address,
          servesCuisine: establishment.category || establishment.type || undefined,
          potentialAction: { "@type": "OrderAction", target: url },
        },
      });
    }).catch(() => {
      if (active) applySeo({ title: "Restaurante indisponível | Plat", description: "Este restaurante não está disponível no momento.", url, index: false });
    });

    return () => { active = false; };
  }, [location.pathname]);

  return null;
}

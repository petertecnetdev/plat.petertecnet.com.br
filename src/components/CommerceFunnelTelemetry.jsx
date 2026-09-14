import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getOrdering } from "../services/platCommerceApi";
import { trackTelemetryEvent } from "../telemetry";

const PENDING_ORDER_KEY = "plat:ordering-funnel:pending";
const ESTABLISHMENT_CONTEXT_PREFIX = "plat:ordering-funnel:establishment:";
const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

const orderingSlug = (pathname = "") => pathname.match(/^\/establishment\/view\/([^/]+)\/?$/)?.[1] || null;
const completedOrderId = (pathname = "") => pathname.match(/^\/(?:pedido|my-orders)\/([^/]+)\/?$/)?.[1] || null;

const acquisitionMetadata = (search = "") => {
  const params = new URLSearchParams(search);
  return {
    source: params.get("source") || "direct",
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
  };
};

const contextStorageKey = (slug) => `${ESTABLISHMENT_CONTEXT_PREFIX}${String(slug || "").trim()}`;

const readEstablishmentContext = (slug) => {
  if (!slug) return null;
  try {
    const context = JSON.parse(sessionStorage.getItem(contextStorageKey(slug)) || "null");
    const id = Number(context?.entity_id);
    if (!Number.isInteger(id) || id <= 0) return null;
    return { entity_type: "establishment", entity_id: id };
  } catch {
    return null;
  }
};

const rememberEstablishmentContext = (slug, establishment) => {
  const id = Number(establishment?.id);
  if (!slug || !Number.isInteger(id) || id <= 0) return null;
  const context = { entity_type: "establishment", entity_id: id };
  try {
    sessionStorage.setItem(contextStorageKey(slug), JSON.stringify(context));
  } catch {
    // Funnel telemetry remains best-effort when browser storage is unavailable.
  }
  return context;
};

const funnelMetadata = (slug, search = "") => ({
  slug,
  ...(readEstablishmentContext(slug) || {}),
  ...acquisitionMetadata(search),
});

const readPending = () => {
  try {
    const pending = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) || "null");
    if (!pending?.slug || !pending?.started_at) return null;
    if (Date.now() - Number(pending.started_at) > PENDING_MAX_AGE_MS) {
      sessionStorage.removeItem(PENDING_ORDER_KEY);
      return null;
    }
    return pending;
  } catch {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    return null;
  }
};

export default function CommerceFunnelTelemetry() {
  const location = useLocation();

  useEffect(() => {
    const slug = orderingSlug(location.pathname);
    if (slug) {
      let active = true;
      const existingContext = readEstablishmentContext(slug);
      const trackCatalogView = (context = existingContext) => {
        if (!active) return;
        trackTelemetryEvent("plat_ordering_catalog_viewed", {
          target: "public_catalog",
          label: slug,
          metadata: {
            slug,
            ...(context || {}),
            ...acquisitionMetadata(location.search),
          },
        });
      };

      if (existingContext) {
        trackCatalogView(existingContext);
      } else {
        getOrdering(slug)
          .then((ordering) => trackCatalogView(rememberEstablishmentContext(slug, ordering?.establishment)))
          .catch(() => trackCatalogView(null));
      }

      return () => { active = false; };
    }

    const orderId = completedOrderId(location.pathname);
    if (!orderId) return undefined;
    const pending = readPending();
    if (!pending) return undefined;

    trackTelemetryEvent("plat_ordering_order_created", {
      target: "order",
      label: String(orderId),
      metadata: {
        order_id: String(orderId),
        slug: pending.slug,
        item_count: pending.item_count || 0,
        ...(pending.entity_id ? { entity_type: "establishment", entity_id: pending.entity_id } : {}),
        source: pending.source || "direct",
        utm_source: pending.utm_source || "",
        utm_medium: pending.utm_medium || "",
        utm_campaign: pending.utm_campaign || "",
      },
    });
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    return undefined;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const pathname = location.pathname;
    const search = location.search;

    const onClick = (event) => {
      const slug = orderingSlug(pathname);
      if (!slug) return;
      const button = event.target?.closest?.("button");
      if (!button) return;

      const ariaLabel = String(button.getAttribute("aria-label") || "");
      if (/^Adicionar\s+/i.test(ariaLabel)) {
        trackTelemetryEvent("plat_ordering_item_added", {
          target: "cart",
          label: ariaLabel.replace(/^Adicionar\s+/i, "").trim(),
          metadata: funnelMetadata(slug, search),
        });
        return;
      }

      if (button.classList.contains("plat-customer-cta") && !button.disabled) {
        trackTelemetryEvent("plat_ordering_checkout_opened", {
          target: "checkout",
          label: slug,
          metadata: funnelMetadata(slug, search),
        });
      }
    };

    const onSubmit = (event) => {
      const slug = orderingSlug(pathname);
      if (!slug || !event.target?.matches?.("form.plat-checkout")) return;
      const itemCount = Array.from(document.querySelectorAll(".plat-cart-count b"))
        .reduce((total, node) => total + Number(node.textContent || 0), 0);
      const metadata = funnelMetadata(slug, search);

      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        slug,
        item_count: itemCount,
        started_at: Date.now(),
        entity_id: metadata.entity_id || null,
        source: metadata.source,
        utm_source: metadata.utm_source,
        utm_medium: metadata.utm_medium,
        utm_campaign: metadata.utm_campaign,
      }));

      trackTelemetryEvent("plat_ordering_checkout_submitted", {
        target: "checkout",
        label: slug,
        metadata: { ...metadata, item_count: itemCount },
      });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [location.pathname, location.search]);

  return null;
}

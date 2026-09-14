import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackTelemetryEvent } from "../telemetry";

const PENDING_ORDER_KEY = "plat:ordering-funnel:pending";
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
      trackTelemetryEvent("plat_ordering_catalog_viewed", {
        target: "public_catalog",
        label: slug,
        metadata: { slug, ...acquisitionMetadata(location.search) },
      });
      return;
    }

    const orderId = completedOrderId(location.pathname);
    if (!orderId) return;
    const pending = readPending();
    if (!pending) return;

    trackTelemetryEvent("plat_ordering_order_created", {
      target: "order",
      label: String(orderId),
      metadata: {
        order_id: String(orderId),
        slug: pending.slug,
        item_count: pending.item_count || 0,
        source: pending.source || "direct",
        utm_source: pending.utm_source || "",
        utm_medium: pending.utm_medium || "",
        utm_campaign: pending.utm_campaign || "",
      },
    });
    sessionStorage.removeItem(PENDING_ORDER_KEY);
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
          metadata: { slug, ...acquisitionMetadata(search) },
        });
        return;
      }

      if (button.classList.contains("plat-customer-cta") && !button.disabled) {
        trackTelemetryEvent("plat_ordering_checkout_opened", {
          target: "checkout",
          label: slug,
          metadata: { slug, ...acquisitionMetadata(search) },
        });
      }
    };

    const onSubmit = (event) => {
      const slug = orderingSlug(pathname);
      if (!slug || !event.target?.matches?.("form.plat-checkout")) return;
      const itemCount = Array.from(document.querySelectorAll(".plat-cart-count b"))
        .reduce((total, node) => total + Number(node.textContent || 0), 0);
      const acquisition = acquisitionMetadata(search);

      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        slug,
        item_count: itemCount,
        started_at: Date.now(),
        ...acquisition,
      }));

      trackTelemetryEvent("plat_ordering_checkout_submitted", {
        target: "checkout",
        label: slug,
        metadata: { slug, item_count: itemCount, ...acquisition },
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

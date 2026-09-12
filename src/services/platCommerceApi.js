import axios from "axios";
import { apiV1BaseUrl } from "../config";

const token = () => localStorage.getItem("token") || "";
const headers = () => ({ Authorization: `Bearer ${token()}` });
const orderingRequests = new Map();
const checkoutRequests = new Map();
const acquisitionStorageKey = "plat:acquisition-attribution";
const acquisitionTtlMs = 7 * 24 * 60 * 60 * 1000;

const trimParam = (value, max = 160) => String(value || "").trim().slice(0, max) || null;

const readStoredAcquisitionAttribution = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = JSON.parse(sessionStorage.getItem(acquisitionStorageKey) || "null");
    const capturedAt = Date.parse(stored?.acquisition_captured_at || "");
    if (!stored || !Number.isFinite(capturedAt) || Date.now() - capturedAt > acquisitionTtlMs) {
      sessionStorage.removeItem(acquisitionStorageKey);
      return null;
    }
    return stored;
  } catch {
    sessionStorage.removeItem(acquisitionStorageKey);
    return null;
  }
};

const captureAcquisitionAttribution = () => {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const attribution = {
    utm_source: trimParam(params.get("utm_source")),
    utm_medium: trimParam(params.get("utm_medium")),
    utm_campaign: trimParam(params.get("utm_campaign")),
    utm_content: trimParam(params.get("utm_content")),
    utm_term: trimParam(params.get("utm_term")),
    acquisition_source: trimParam(params.get("source") || params.get("referral") || params.get("ref")),
    acquisition_landing: trimParam(`${window.location.pathname}${window.location.search}`, 1000),
    acquisition_captured_at: new Date().toISOString(),
  };

  const hasAcquisitionSignal = Boolean(
    attribution.acquisition_source ||
      attribution.utm_source ||
      attribution.utm_medium ||
      attribution.utm_campaign ||
      attribution.utm_content ||
      attribution.utm_term
  );

  if (!hasAcquisitionSignal) return readStoredAcquisitionAttribution();

  try {
    sessionStorage.setItem(acquisitionStorageKey, JSON.stringify(attribution));
  } catch {
    // Checkout must remain usable when browser storage is unavailable.
  }
  return attribution;
};

const checkoutAcquisitionAttribution = () => captureAcquisitionAttribution() || readStoredAcquisitionAttribution();

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const unavailableOrdering = (reason = "Pedidos online temporariamente indisponíveis.") => ({
  available: false,
  open_now: false,
  accepting_orders: false,
  ordering_enabled: false,
  unavailable_reason: reason,
  fulfillment: { delivery: false, pickup: false, "dine-in": false },
  delivery_fee: 0,
  minimum_order: 0,
  estimated_delivery_minutes: null,
  opening_hours: [],
  payment_methods: [],
});

const orderingFromSettings = (settings, establishment) => {
  if (!settings) {
    return unavailableOrdering(
      establishment?.is_published === false
        ? "Prévia do estabelecimento. Publique a operação para receber pedidos."
        : undefined
    );
  }

  const published = establishment?.is_published !== false;
  const enabled = Boolean(settings.ordering_enabled ?? true);
  const accepting = Boolean(settings.accepting_orders ?? true);

  return {
    available: published && enabled && accepting,
    open_now: published,
    accepting_orders: accepting,
    ordering_enabled: enabled,
    unavailable_reason: !published
      ? "Prévia do estabelecimento. Publique a operação para receber pedidos."
      : !enabled
        ? "Pedidos online estão desativados."
        : !accepting
          ? "O estabelecimento pausou novos pedidos."
          : null,
    fulfillment: {
      delivery: Boolean(settings.delivery_enabled ?? true),
      pickup: Boolean(settings.pickup_enabled ?? true),
      "dine-in": Boolean(settings.dine_in_enabled ?? false),
    },
    delivery_fee: Number(settings.delivery_fee || 0),
    minimum_order: Number(settings.minimum_order || 0),
    estimated_delivery_minutes: settings.estimated_delivery_minutes || null,
    opening_hours: settings.opening_hours || [],
    payment_methods: Array.isArray(settings.payment_methods) ? settings.payment_methods : [],
  };
};

export const getRestaurants = async (params = {}) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments`, { params });
  return data?.data || { data: [] };
};

export const getMyEstablishments = async () => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/establishments`, {
    headers: headers(),
  });
  return asList(data?.data);
};

const getPublicCatalogFallback = async (slug) => {
  const key = encodeURIComponent(String(slug || "").trim());
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${key}/catalog`);
  const catalog = data?.data || {};

  return {
    establishment: catalog.establishment || null,
    items: asList(catalog.items),
    ordering: unavailableOrdering(
      "O cardápio está disponível, mas os pedidos online estão temporariamente indisponíveis."
    ),
    degraded: true,
  };
};

const getOwnerPreviewFallback = async (slug) => {
  if (!token()) return null;

  const establishments = await getMyEstablishments();
  const establishment = establishments.find(
    (candidate) => String(candidate?.slug || "").trim() === String(slug || "").trim()
  );

  if (!establishment) return null;

  const [itemsResult, settingsResult] = await Promise.allSettled([
    axios.get(`${apiV1BaseUrl}/establishments/${establishment.id}/items`, {
      headers: headers(),
    }),
    axios.get(`${apiV1BaseUrl}/establishments/${establishment.id}/ordering-settings`, {
      headers: headers(),
    }),
  ]);

  const items =
    itemsResult.status === "fulfilled"
      ? asList(itemsResult.value?.data?.data)
      : [];
  const settings =
    settingsResult.status === "fulfilled"
      ? settingsResult.value?.data?.data || null
      : null;

  return {
    establishment,
    items,
    ordering: orderingFromSettings(settings, establishment),
    preview: true,
  };
};

export const getOrdering = async (slug) => {
  captureAcquisitionAttribution();
  const key = String(slug || "").trim();
  const cached = orderingRequests.get(key);
  if (cached && Date.now() - cached.createdAt < 5000) return cached.promise;

  const promise = axios
    .get(`${apiV1BaseUrl}/establishments/${encodeURIComponent(key)}/ordering`)
    .then(({ data }) => data?.data || {})
    .catch(async (error) => {
      orderingRequests.delete(key);

      if (error?.response?.status !== 404) throw error;

      try {
        return await getPublicCatalogFallback(key);
      } catch (catalogError) {
        const ownerPreview = await getOwnerPreviewFallback(key);
        if (ownerPreview) return ownerPreview;
        throw catalogError || error;
      }
    });

  orderingRequests.set(key, { createdAt: Date.now(), promise });
  return promise;
};

export const createCheckout = async (payload) => {
  const attribution = payload?.acquisition_attribution || checkoutAcquisitionAttribution();
  const checkoutPayload = attribution
    ? { ...payload, acquisition_attribution: attribution }
    : payload;
  const requestKey = JSON.stringify(checkoutPayload);
  const inFlight = checkoutRequests.get(requestKey);
  if (inFlight) return inFlight;

  const request = axios
    .post(`${apiV1BaseUrl}/orders`, checkoutPayload, { headers: headers() })
    .then(({ data }) => data?.data || {})
    .finally(() => checkoutRequests.delete(requestKey));

  checkoutRequests.set(requestKey, request);
  return request;
};

export const getMyOrders = async () => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders`, { headers: headers() });
  return data?.data || { data: [] };
};

export const getMyOrder = async (id) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders/${id}`, { headers: headers() });
  return data?.data || null;
};

export const getMyOrderPayment = async (id) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders/${id}/payment`, { headers: headers() });
  return data?.data || null;
};

export const getEstablishmentOrders = async (establishmentId, params = {}) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${establishmentId}/orders`, { headers: headers(), params });
  return data?.data || { data: [] };
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await axios.patch(`${apiV1BaseUrl}/orders/${id}/status`, { status }, { headers: headers() });
  return data?.data || null;
};

export const getDashboardSummary = async () => {
  const { data } = await axios.get(`${apiV1BaseUrl}/dashboard`, { headers: headers() });
  return data?.data || { totals: {}, establishments: [] };
};

export const getOrderingSettings = async (establishmentId) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${establishmentId}/ordering-settings`, { headers: headers() });
  return data?.data || null;
};

export const updateOrderingSettings = async (establishmentId, payload) => {
  const { data } = await axios.patch(`${apiV1BaseUrl}/establishments/${establishmentId}/ordering-settings`, payload, { headers: headers() });
  return data?.data || null;
};

export const apiErrorMessage = (error, fallback = "Não foi possível concluir a operação.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") ||
  error?.message ||
  fallback;

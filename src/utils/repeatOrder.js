const REPEAT_ORDER_CONTEXT_KEY = "plat-repeat-order-context";
const REPEAT_ORDER_CONTEXT_TTL_MS = 2 * 60 * 60 * 1000;
const REPEAT_ORDER_CONVERSION_PREFIX = "plat-repeat-order-conversion:";
const REPEAT_ORDER_CONVERSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const cartFromTrackedOrder = (order) => {
  const cart = {};

  for (const line of Array.isArray(order?.items) ? order.items : []) {
    const itemId = Number(line?.item_id);
    const quantity = Math.max(0, Math.floor(Number(line?.quantity || 0)));
    if (!Number.isInteger(itemId) || itemId < 1 || quantity < 1) continue;

    const current = cart[itemId] || { quantity: 0, additions: [], removals: [], notes: "" };
    cart[itemId] = {
      ...current,
      quantity: current.quantity + quantity,
    };
  }

  return cart;
};

export const restoreTrackedOrderCart = (order) => {
  const slug = String(order?.establishment?.slug || "").trim();
  if (!slug || typeof window === "undefined" || !window.localStorage) return false;

  const cart = cartFromTrackedOrder(order);
  if (Object.keys(cart).length === 0) return false;

  try {
    window.localStorage.setItem(`plat-cart:${slug}`, JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
};

export const rememberRepeatOrderContext = (order) => {
  const slug = String(order?.establishment?.slug || "").trim();
  const sourceOrderId = order?.id;
  if (!slug || sourceOrderId === undefined || sourceOrderId === null || typeof window === "undefined" || !window.sessionStorage) return false;

  const context = {
    source_order_id: sourceOrderId,
    establishment_id: order?.establishment?.id ?? null,
    establishment_slug: slug,
    started_at: Date.now(),
  };

  try {
    window.sessionStorage.setItem(REPEAT_ORDER_CONTEXT_KEY, JSON.stringify(context));
    return true;
  } catch {
    return false;
  }
};

export const clearRepeatOrderContext = () => {
  try {
    window.sessionStorage?.removeItem(REPEAT_ORDER_CONTEXT_KEY);
  } catch {
    // Storage can be unavailable in hardened browser contexts.
  }
};

export const readRepeatOrderContext = (slug) => {
  if (typeof window === "undefined" || !window.sessionStorage) return null;

  try {
    const raw = window.sessionStorage.getItem(REPEAT_ORDER_CONTEXT_KEY);
    if (!raw) return null;
    const context = JSON.parse(raw);
    const startedAt = Number(context?.started_at || 0);
    const expectedSlug = String(slug || "").trim();
    const contextSlug = String(context?.establishment_slug || "").trim();
    const expired = !startedAt || Date.now() - startedAt > REPEAT_ORDER_CONTEXT_TTL_MS;
    const invalid = context?.source_order_id === undefined || context?.source_order_id === null || !contextSlug;

    if (expired || invalid || (expectedSlug && expectedSlug !== contextSlug)) {
      clearRepeatOrderContext();
      return null;
    }

    return context;
  } catch {
    clearRepeatOrderContext();
    return null;
  }
};

const repeatConversionKey = (orderId) => `${REPEAT_ORDER_CONVERSION_PREFIX}${String(orderId || "").trim()}`;

export const rememberRepeatOrderConversion = (order, sourceContext = readRepeatOrderContext()) => {
  const newOrderId = order?.id;
  if (
    !sourceContext ||
    sourceContext.source_order_id === undefined ||
    sourceContext.source_order_id === null ||
    newOrderId === undefined ||
    newOrderId === null ||
    typeof window === "undefined" ||
    !window.localStorage
  ) return false;

  const context = {
    source_order_id: sourceContext.source_order_id,
    new_order_id: newOrderId,
    establishment_id: order?.establishment_id ?? sourceContext.establishment_id ?? null,
    created_at: Date.now(),
    paid_tracked: false,
    completed_tracked: false,
  };

  try {
    window.localStorage.setItem(repeatConversionKey(newOrderId), JSON.stringify(context));
    return true;
  } catch {
    return false;
  }
};

export const readRepeatOrderConversion = (orderId) => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const key = repeatConversionKey(orderId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const context = JSON.parse(raw);
    const createdAt = Number(context?.created_at || 0);
    const expectedOrderId = String(orderId || "").trim();
    const storedOrderId = String(context?.new_order_id || "").trim();
    const expired = !createdAt || Date.now() - createdAt > REPEAT_ORDER_CONVERSION_TTL_MS;
    const invalid = !expectedOrderId || !storedOrderId || expectedOrderId !== storedOrderId || context?.source_order_id === undefined || context?.source_order_id === null;

    if (expired || invalid) {
      window.localStorage.removeItem(key);
      return null;
    }

    return context;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const markRepeatOrderConversionMilestone = (orderId, milestone) => {
  const context = readRepeatOrderConversion(orderId);
  if (!context || !["paid", "completed"].includes(milestone)) return null;
  const field = `${milestone}_tracked`;
  if (context[field]) return null;

  const next = { ...context, [field]: true };
  try {
    window.localStorage.setItem(repeatConversionKey(orderId), JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
};

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

const latestGuestOrderKey = "plat:guest-order:latest";
const guestOrderPrefix = "plat:guest-order:";
const guestOrderTtlMs = 30 * 24 * 60 * 60 * 1000;

const storageAvailable = () => typeof window !== "undefined" && Boolean(window.localStorage);

export const rememberGuestOrder = (order, phone) => {
  if (!storageAvailable() || !order?.id || !String(phone || "").trim()) return;

  const value = {
    id: order.id,
    order_number: order.order_number || order.id,
    phone: String(phone).trim(),
    establishment: order.establishment || null,
    saved_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${guestOrderPrefix}${order.id}`, JSON.stringify(value));
    localStorage.setItem(latestGuestOrderKey, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("plat:guest-order-created", { detail: value }));
  } catch {
    // Guest checkout must never fail because browser storage is unavailable.
  }
};

const validStoredOrder = (value) => {
  const savedAt = Date.parse(value?.saved_at || "");
  return Boolean(
    value?.id &&
    value?.phone &&
    Number.isFinite(savedAt) &&
    Date.now() - savedAt <= guestOrderTtlMs
  );
};

export const readGuestOrder = (id) => {
  if (!storageAvailable()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(`${guestOrderPrefix}${id}`) || "null");
    if (validStoredOrder(value)) return value;
    localStorage.removeItem(`${guestOrderPrefix}${id}`);
  } catch {
    localStorage.removeItem(`${guestOrderPrefix}${id}`);
  }
  return null;
};

export const readLatestGuestOrder = () => {
  if (!storageAvailable()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(latestGuestOrderKey) || "null");
    if (validStoredOrder(value)) return value;
    localStorage.removeItem(latestGuestOrderKey);
  } catch {
    localStorage.removeItem(latestGuestOrderKey);
  }
  return null;
};

export const rememberGuestOrderPhone = (id, phone) => {
  const existing = readGuestOrder(id) || { id, saved_at: new Date().toISOString() };
  rememberGuestOrder(existing, phone);
};

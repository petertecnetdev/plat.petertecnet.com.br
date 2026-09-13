const latestGuestOrderKey = "plat:guest-order:latest";
const guestOrderPrefix = "plat:guest-order:";
const guestOrderPhonePrefix = "plat:guest-order-phone:";
const guestOrderTtlMs = 30 * 24 * 60 * 60 * 1000;

const storageAvailable = () => typeof window !== "undefined" && Boolean(window.localStorage);
const sessionStorageAvailable = () => typeof window !== "undefined" && Boolean(window.sessionStorage);

const metadataFor = (order) => ({
  id: order.id,
  order_number: order.order_number || order.id,
  establishment: order.establishment || null,
  saved_at: order.saved_at || new Date().toISOString(),
});

const rememberSessionPhone = (id, phone) => {
  if (!sessionStorageAvailable() || !id || !String(phone || "").trim()) return;
  try {
    sessionStorage.setItem(`${guestOrderPhonePrefix}${id}`, String(phone).trim());
  } catch {
    // Tracking can ask for the phone again when session storage is unavailable.
  }
};

const sessionPhoneFor = (id) => {
  if (!sessionStorageAvailable()) return "";
  try {
    return sessionStorage.getItem(`${guestOrderPhonePrefix}${id}`) || "";
  } catch {
    return "";
  }
};

export const rememberGuestOrder = (order, phone) => {
  if (!storageAvailable() || !order?.id) return;

  const value = metadataFor(order);
  rememberSessionPhone(order.id, phone);

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
    Number.isFinite(savedAt) &&
    Date.now() - savedAt <= guestOrderTtlMs
  );
};

const readMetadata = (key) => {
  if (!storageAvailable()) return null;
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (validStoredOrder(value)) return value;
    localStorage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
  }
  return null;
};

export const readGuestOrder = (id) => {
  const value = readMetadata(`${guestOrderPrefix}${id}`);
  return value ? { ...value, phone: sessionPhoneFor(value.id) } : null;
};

export const readLatestGuestOrder = () => readMetadata(latestGuestOrderKey);

export const rememberGuestOrderPhone = (id, phone) => {
  rememberSessionPhone(id, phone);
  const existing = readMetadata(`${guestOrderPrefix}${id}`) || { id, saved_at: new Date().toISOString() };
  rememberGuestOrder(existing, phone);
};
const OFFLINE_PAYMENT_METHODS = new Set(["cash", "card_on_delivery"]);

export const isAuthenticatedCheckout = () => Boolean(localStorage.getItem("token"));

export const isGuestCheckoutMethod = (method) => OFFLINE_PAYMENT_METHODS.has(String(method || ""));

export const canCheckoutAsGuest = (methods = []) =>
  Array.isArray(methods) && methods.some(isGuestCheckoutMethod);

export const preferredCheckoutMethod = (methods = [], authenticated = false) => {
  if (!Array.isArray(methods) || methods.length === 0) return "";
  if (authenticated) return methods[0] || "";
  return methods.find(isGuestCheckoutMethod) || methods[0] || "";
};

export const checkoutResource = (authenticated = false) =>
  authenticated ? "orders" : "guest-orders";

export const checkoutMethodRequiresAuthentication = (method) =>
  String(method || "") === "pix";

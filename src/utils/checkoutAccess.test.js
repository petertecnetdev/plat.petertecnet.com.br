import {
  canCheckoutAsGuest,
  checkoutMethodRequiresAuthentication,
  checkoutResource,
  isGuestCheckoutMethod,
  preferredCheckoutMethod,
} from "./checkoutAccess";

describe("checkout access", () => {
  test("guest checkout accepts only offline payment methods", () => {
    expect(isGuestCheckoutMethod("cash")).toBe(true);
    expect(isGuestCheckoutMethod("card_on_delivery")).toBe(true);
    expect(isGuestCheckoutMethod("pix")).toBe(false);
    expect(canCheckoutAsGuest(["pix", "cash"])).toBe(true);
    expect(canCheckoutAsGuest(["pix"])).toBe(false);
  });

  test("guest defaults to an offline method when one is available", () => {
    expect(preferredCheckoutMethod(["pix", "card_on_delivery", "cash"], false)).toBe("card_on_delivery");
    expect(preferredCheckoutMethod(["pix", "cash"], false)).toBe("cash");
    expect(preferredCheckoutMethod(["pix", "cash"], true)).toBe("pix");
  });

  test("routes authenticated and guest orders to separate API resources", () => {
    expect(checkoutResource(true)).toBe("orders");
    expect(checkoutResource(false)).toBe("guest-orders");
    expect(checkoutMethodRequiresAuthentication("pix")).toBe(true);
    expect(checkoutMethodRequiresAuthentication("cash")).toBe(false);
  });
});

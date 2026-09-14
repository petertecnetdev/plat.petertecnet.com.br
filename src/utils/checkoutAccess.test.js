import {
  canCheckoutAsGuest,
  checkoutMethodRequiresAuthentication,
  checkoutResource,
  isGuestCheckoutMethod,
  preferredCheckoutMethod,
} from "./checkoutAccess";

describe("checkout access", () => {
  test("guest checkout accepts Pix and offline payment methods", () => {
    expect(isGuestCheckoutMethod("cash")).toBe(true);
    expect(isGuestCheckoutMethod("card_on_delivery")).toBe(true);
    expect(isGuestCheckoutMethod("pix")).toBe(true);
    expect(canCheckoutAsGuest(["pix", "cash"])).toBe(true);
    expect(canCheckoutAsGuest(["pix"])).toBe(true);
  });

  test("guest can default directly to Pix when it is offered first", () => {
    expect(preferredCheckoutMethod(["pix", "card_on_delivery", "cash"], false)).toBe("pix");
    expect(preferredCheckoutMethod(["pix", "cash"], false)).toBe("pix");
    expect(preferredCheckoutMethod(["pix", "cash"], true)).toBe("pix");
  });

  test("routes authenticated and guest orders to separate API resources", () => {
    expect(checkoutResource(true)).toBe("orders");
    expect(checkoutResource(false)).toBe("guest-orders");
    expect(checkoutMethodRequiresAuthentication("pix")).toBe(false);
    expect(checkoutMethodRequiresAuthentication("cash")).toBe(false);
  });
});

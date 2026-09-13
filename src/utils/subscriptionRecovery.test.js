import {
  buildSubscriptionRecoveryUrl,
  safeSubscriptionReturnTo,
} from "./subscriptionRecovery";

describe("subscription recovery", () => {
  const origin = "https://plat.petertecnet.com.br";

  test("returns the real plans route and preserves commercial attribution", () => {
    expect(buildSubscriptionRecoveryUrl({
      planCode: "pro",
      referral: "menu-42",
      campaign: "organic-menu",
      returnTo: "/establishment/42/ordering-settings?tab=payments#pix",
      origin,
    })).toBe(
      "/planos?plan=pro&resume=1&source=payment_recovery&ref=menu-42&utm_campaign=organic-menu&return_to=%2Festablishment%2F42%2Fordering-settings%3Ftab%3Dpayments%23pix"
    );
  });

  test("rejects external and looping return destinations", () => {
    expect(safeSubscriptionReturnTo("https://evil.example/path", origin)).toBe("");
    expect(safeSubscriptionReturnTo("//evil.example/path", origin)).toBe("");
    expect(safeSubscriptionReturnTo("/planos?plan=pro", origin)).toBe("");
  });

  test("rejects an invalid plan instead of building a recovery URL", () => {
    expect(buildSubscriptionRecoveryUrl({ planCode: "pro?redirect=x", origin })).toBe("");
  });
});

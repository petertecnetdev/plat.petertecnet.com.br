import { buildSubscriptionRevenueAttribution } from "./subscriptionRevenueAttribution";

const storageWith = (value) => ({
  getItem: () => JSON.stringify(value),
});

describe("subscription revenue attribution", () => {
  const now = Date.parse("2026-09-13T12:00:00.000Z");

  test("marks payment recovery while preserving the original acquisition source", () => {
    const attribution = buildSubscriptionRevenueAttribution({
      search: "?source=payment_recovery&resume=1&plan=pro",
      storage: storageWith({
        application: "plat",
        plan: "pro",
        source: "seo-cardapio",
        referral: "partner-42",
        campaign: "cardapio-digital",
        selected_at: "2026-09-13T11:00:00.000Z",
      }),
      now,
    });

    expect(attribution).toEqual({
      plan: "pro",
      original_source: "seo-cardapio",
      entry_source: "payment_recovery",
      recovery_source: "payment_recovery",
      recovery_flow: true,
      referral: "partner-42",
      campaign: "cardapio-digital",
    });
  });

  test("keeps normal subscription conversions outside recovery", () => {
    const attribution = buildSubscriptionRevenueAttribution({
      search: "?source=organic_search&utm_campaign=qr-code",
      storage: storageWith({
        application: "plat",
        plan: "starter",
        source: "organic_search",
        selected_at: "2026-09-13T11:30:00.000Z",
      }),
      now,
    });

    expect(attribution).toEqual({
      plan: "starter",
      original_source: "organic_search",
      entry_source: "organic_search",
      campaign: "qr-code",
    });
  });

  test("ignores stale pending attribution", () => {
    const attribution = buildSubscriptionRevenueAttribution({
      search: "?source=payment_recovery&plan=pro",
      storage: storageWith({
        application: "plat",
        plan: "legacy",
        source: "old-campaign",
        selected_at: "2026-09-01T10:00:00.000Z",
      }),
      now,
    });

    expect(attribution).toEqual({
      plan: "pro",
      original_source: "payment_recovery",
      entry_source: "payment_recovery",
      recovery_source: "payment_recovery",
      recovery_flow: true,
    });
  });
});

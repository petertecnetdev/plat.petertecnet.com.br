import { canReuseTerminalSubscriptionIntent } from "./subscriptionIntent";

describe("canReuseTerminalSubscriptionIntent", () => {
  const pending = {
    application: "plat",
    plan: "pro",
    intent_id: "intent-123",
  };

  test.each(["rejected", "cancelled", "canceled"])(
    "reuses the same valid Plat intent after retryable PIX status %s",
    (status) => {
      expect(canReuseTerminalSubscriptionIntent(pending, "intent-123", status)).toBe(true);
    }
  );

  test.each(["expired", "failed", "refunded", "charged_back", "chargeback"])(
    "creates a fresh intent instead of reusing unsafe terminal PIX status %s",
    (status) => {
      expect(canReuseTerminalSubscriptionIntent(pending, "intent-123", status)).toBe(false);
    }
  );

  test("rejects a different intent to avoid recovering the wrong payment aggregate", () => {
    expect(canReuseTerminalSubscriptionIntent(pending, "intent-456", "rejected")).toBe(false);
  });

  test("rejects intent state belonging to another application", () => {
    expect(
      canReuseTerminalSubscriptionIntent(
        { ...pending, application: "other" },
        "intent-123",
        "rejected"
      )
    ).toBe(false);
  });

  test("rejects malformed plan state", () => {
    expect(
      canReuseTerminalSubscriptionIntent(
        { ...pending, plan: "plano inválido!" },
        "intent-123",
        "rejected"
      )
    ).toBe(false);
  });
});

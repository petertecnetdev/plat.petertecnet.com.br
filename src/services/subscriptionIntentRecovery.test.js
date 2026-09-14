import { canReuseTerminalSubscriptionIntent } from "./subscriptionIntent";

describe("canReuseTerminalSubscriptionIntent", () => {
  const pending = {
    application: "plat",
    plan: "pro",
    intent_id: "intent-123",
  };

  test("reuses the same valid Plat intent after a terminal PIX attempt", () => {
    expect(canReuseTerminalSubscriptionIntent(pending, "intent-123")).toBe(true);
  });

  test("rejects a different intent to avoid recovering the wrong payment aggregate", () => {
    expect(canReuseTerminalSubscriptionIntent(pending, "intent-456")).toBe(false);
  });

  test("rejects intent state belonging to another application", () => {
    expect(canReuseTerminalSubscriptionIntent({ ...pending, application: "other" }, "intent-123")).toBe(false);
  });

  test("rejects malformed plan state", () => {
    expect(canReuseTerminalSubscriptionIntent({ ...pending, plan: "plano inválido!" }, "intent-123")).toBe(false);
  });
});

import { clampCartQuantity, isModifierAvailableForQuantity, isSellableModifier, reconcileCartAvailability } from "./cartAvailability";

describe("cart availability guards", () => {
  test("caps cart quantity at available stock", () => {
    expect(clampCartQuantity(2, 1, 2)).toBe(2);
    expect(clampCartQuantity(1, -1, 2)).toBe(0);
  });

  test("removes unavailable lines and stale modifiers from a persisted cart", () => {
    const cart = {
      10: { quantity: 5, additions: [20, 21], removals: [], notes: "sem cebola" },
      11: { quantity: 1, additions: [], removals: [], notes: "" },
    };
    const items = [
      { id: 10, status: 1, type: "product", stock: 2 },
      { id: 11, status: 1, type: "product", stock: 0 },
      { id: 20, status: 1, type: "modifier", stock: 3 },
      { id: 21, status: 1, type: "modifier", stock: 0 },
    ];

    expect(reconcileCartAvailability(cart, items)).toEqual({
      10: { quantity: 2, additions: [20], removals: [], notes: "sem cebola" },
    });
  });

  test("only exposes active modifiers with stock", () => {
    expect(isSellableModifier({ status: 1, type: "modifier", stock: 1 })).toBe(true);
    expect(isSellableModifier({ status: 0, type: "modifier", stock: 1 })).toBe(false);
    expect(isSellableModifier({ status: 1, type: "modifier", stock: 0 })).toBe(false);
  });

  test("requires modifier stock for the whole selected quantity", () => {
    const modifier = { status: 1, type: "modifier", stock: 2 };
    expect(isModifierAvailableForQuantity(modifier, 2)).toBe(true);
    expect(isModifierAvailableForQuantity(modifier, 3)).toBe(false);
  });

  test("removes a modifier when its stock cannot cover the cart line quantity", () => {
    const cart = {
      10: { quantity: 3, additions: [20, 21], removals: [], notes: "" },
    };
    const items = [
      { id: 10, status: 1, type: "product", stock: 5 },
      { id: 20, status: 1, type: "modifier", stock: 2 },
      { id: 21, status: 1, type: "modifier", stock: 3 },
    ];

    expect(reconcileCartAvailability(cart, items)).toEqual({
      10: { quantity: 3, additions: [21], removals: [], notes: "" },
    });
  });
});

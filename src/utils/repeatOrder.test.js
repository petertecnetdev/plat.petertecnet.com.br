import {
  cartFromTrackedOrder,
  clearRepeatOrderContext,
  readRepeatOrderContext,
  rememberRepeatOrderContext,
  restoreTrackedOrderCart,
} from "./repeatOrder";

describe("repeat order", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test("rebuilds only valid base items and merges duplicate lines", () => {
    expect(cartFromTrackedOrder({ items: [
      { item_id: 10, quantity: 2 },
      { item_id: 10, quantity: 1 },
      { item_id: 11, quantity: 0 },
      { item_id: null, quantity: 2 },
    ] })).toEqual({
      10: { quantity: 3, additions: [], removals: [], notes: "" },
    });
  });

  test("stores the cart under the establishment slug for server-side revalidation on menu load", () => {
    const order = {
      establishment: { slug: "bar-do-centro" },
      items: [{ item_id: 21, quantity: 2 }],
    };

    expect(restoreTrackedOrderCart(order)).toBe(true);
    expect(JSON.parse(window.localStorage.getItem("plat-cart:bar-do-centro"))).toEqual({
      21: { quantity: 2, additions: [], removals: [], notes: "" },
    });
  });

  test("keeps only non-sensitive repeat attribution in session storage", () => {
    const order = {
      id: 501,
      customer_phone: "62999999999",
      delivery_address: "Rua privada",
      establishment: { id: 8, slug: "bar-do-centro" },
      items: [{ item_id: 21, quantity: 2 }],
    };

    expect(rememberRepeatOrderContext(order)).toBe(true);
    const context = readRepeatOrderContext("bar-do-centro");
    expect(context).toEqual(expect.objectContaining({
      source_order_id: 501,
      establishment_id: 8,
      establishment_slug: "bar-do-centro",
    }));
    expect(JSON.stringify(context)).not.toContain("62999999999");
    expect(JSON.stringify(context)).not.toContain("Rua privada");
  });

  test("rejects context for another establishment and clears it", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    expect(readRepeatOrderContext("outro-bar")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  test("clears repeat attribution explicitly after conversion", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    clearRepeatOrderContext();
    expect(readRepeatOrderContext("bar-do-centro")).toBeNull();
  });

  test("does not persist an empty or unscoped cart", () => {
    expect(restoreTrackedOrderCart({ establishment: { slug: "" }, items: [{ item_id: 1, quantity: 1 }] })).toBe(false);
    expect(restoreTrackedOrderCart({ establishment: { slug: "x" }, items: [] })).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });
});

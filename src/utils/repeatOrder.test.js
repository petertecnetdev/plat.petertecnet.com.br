import { cartFromTrackedOrder, restoreTrackedOrderCart } from "./repeatOrder";

describe("repeat order", () => {
  beforeEach(() => window.localStorage.clear());

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

  test("does not persist an empty or unscoped cart", () => {
    expect(restoreTrackedOrderCart({ establishment: { slug: "" }, items: [{ item_id: 1, quantity: 1 }] })).toBe(false);
    expect(restoreTrackedOrderCart({ establishment: { slug: "x" }, items: [] })).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });
});

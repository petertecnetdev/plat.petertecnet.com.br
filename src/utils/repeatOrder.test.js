import {
  cartFromTrackedOrder,
  claimRepeatOrderConversion,
  clearRepeatOrderContext,
  markRepeatOrderConversionMilestone,
  readRepeatOrderContext,
  readRepeatOrderConversion,
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

  test("rejects context for another establishment without creating a conversion seed", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    expect(readRepeatOrderContext("outro-bar")).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
    expect(window.localStorage.getItem("plat-repeat-order-conversion-seed")).toBeNull();
  });

  test("preserves a short-lived non-sensitive conversion seed after successful checkout", () => {
    expect(rememberRepeatOrderContext({
      id: 501,
      customer_phone: "62999999999",
      establishment: { id: 8, slug: "bar-do-centro" },
    })).toBe(true);

    clearRepeatOrderContext();

    expect(readRepeatOrderContext("bar-do-centro")).toBeNull();
    const seed = JSON.parse(window.localStorage.getItem("plat-repeat-order-conversion-seed"));
    expect(seed).toEqual(expect.objectContaining({
      source_order_id: 501,
      establishment_id: 8,
      establishment_slug: "bar-do-centro",
    }));
    expect(JSON.stringify(seed)).not.toContain("62999999999");
  });

  test("claims the repeat conversion for the newly tracked order and consumes the seed", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    clearRepeatOrderContext();

    const conversion = claimRepeatOrderConversion({ id: 777, establishment: { id: 8, slug: "bar-do-centro" } });
    expect(conversion).toEqual(expect.objectContaining({
      source_order_id: 501,
      new_order_id: 777,
      establishment_id: 8,
      paid_tracked: false,
      completed_tracked: false,
    }));
    expect(window.localStorage.getItem("plat-repeat-order-conversion-seed")).toBeNull();
    expect(readRepeatOrderConversion(777)).toEqual(expect.objectContaining({ source_order_id: 501 }));
  });

  test("does not claim a conversion for another establishment", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    clearRepeatOrderContext();

    expect(claimRepeatOrderConversion({ id: 777, establishment: { id: 9, slug: "outro-bar" } })).toBeNull();
    expect(readRepeatOrderConversion(777)).toBeNull();
  });

  test("marks paid and completed milestones only once", () => {
    expect(rememberRepeatOrderContext({ id: 501, establishment: { id: 8, slug: "bar-do-centro" } })).toBe(true);
    clearRepeatOrderContext();
    expect(claimRepeatOrderConversion({ id: 777, establishment: { id: 8, slug: "bar-do-centro" } })).not.toBeNull();

    expect(markRepeatOrderConversionMilestone(777, "paid")).toEqual(expect.objectContaining({ paid_tracked: true }));
    expect(markRepeatOrderConversionMilestone(777, "paid")).toBeNull();
    expect(markRepeatOrderConversionMilestone(777, "completed")).toEqual(expect.objectContaining({ completed_tracked: true }));
    expect(markRepeatOrderConversionMilestone(777, "completed")).toBeNull();
  });

  test("does not persist an empty or unscoped cart", () => {
    expect(restoreTrackedOrderCart({ establishment: { slug: "" }, items: [{ item_id: 1, quantity: 1 }] })).toBe(false);
    expect(restoreTrackedOrderCart({ establishment: { slug: "x" }, items: [] })).toBe(false);
    expect(window.localStorage.length).toBe(0);
  });
});

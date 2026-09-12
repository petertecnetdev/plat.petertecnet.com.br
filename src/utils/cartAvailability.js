const defaultLine = { quantity: 0, additions: [], removals: [], notes: "" };

const positiveStock = (item) => Math.max(0, Number(item?.stock || 0));
const isActive = (item) => Number(item?.status) === 1;
const isModifier = (item) => item?.type === "modifier" || String(item?.category || "").toLowerCase().includes("adicion");

export const clampCartQuantity = (currentQuantity, delta, stock) => {
  const next = Number(currentQuantity || 0) + Number(delta || 0);
  return Math.min(positiveStock({ stock }), Math.max(0, next));
};

export const reconcileCartAvailability = (cart, items) => {
  const catalog = Array.isArray(items) ? items : [];
  const byId = new Map(catalog.map((item) => [String(item.id), item]));
  const sellableModifierIds = new Set(
    catalog
      .filter((item) => isActive(item) && isModifier(item) && positiveStock(item) > 0)
      .map((item) => String(item.id)),
  );

  return Object.fromEntries(
    Object.entries(cart || {}).flatMap(([id, rawLine]) => {
      const item = byId.get(String(id));
      if (!item || !isActive(item) || isModifier(item)) return [];

      const stock = positiveStock(item);
      const quantity = Math.min(stock, Math.max(0, Number(rawLine?.quantity || 0)));
      if (quantity < 1) return [];

      const additions = Array.isArray(rawLine?.additions)
        ? rawLine.additions.filter((modifierId) => sellableModifierIds.has(String(modifierId)))
        : [];

      return [[id, { ...defaultLine, ...rawLine, quantity, additions }]];
    }),
  );
};

export const isSellableModifier = (item) => isActive(item) && isModifier(item) && positiveStock(item) > 0;

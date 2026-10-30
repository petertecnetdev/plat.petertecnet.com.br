// Os valores são apenas uma prévia para revisão; a API define o preço final.
const cents = (value) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
};

const subtotalCents = (cart, catalog) => {
  const byId = new Map((Array.isArray(catalog) ? catalog : []).map((item) => [String(item.id), item]));
  return Object.entries(cart || {}).reduce((sum, [id, line]) => {
    const quantity = Number(line?.quantity || 0);
    if (quantity <= 0) return sum;
    const item = byId.get(String(id));
    const additions = Array.isArray(line?.additions) ? line.additions : [];
    const unit = cents(item?.price) + additions.reduce((total, modifierId) => (
      total + cents(byId.get(String(modifierId))?.price)
    ), 0);
    return sum + quantity * unit;
  }, 0);
};

export const reviewCheckoutConditions = ({
  cart, currentItems, latestItems, currentOrdering, latestOrdering, fulfillment, paymentMethod,
}) => {
  const beforeSubtotal = subtotalCents(cart, currentItems);
  const afterSubtotal = subtotalCents(cart, latestItems);
  const delivery = fulfillment === "delivery";
  const beforeFee = delivery ? cents(currentOrdering?.delivery_fee) : 0;
  const afterFee = delivery ? cents(latestOrdering?.delivery_fee) : 0;
  const beforeMinimum = cents(currentOrdering?.minimum_order);
  const afterMinimum = cents(latestOrdering?.minimum_order);
  const priceChanged = beforeSubtotal !== afterSubtotal || beforeFee !== afterFee
    || !Number.isFinite(afterSubtotal) || !Number.isFinite(afterFee);
  const minimumChanged = beforeMinimum !== afterMinimum || !Number.isFinite(afterMinimum);
  const fulfillmentUnavailable = !latestOrdering?.fulfillment?.[fulfillment];
  const paymentUnavailable = !Array.isArray(latestOrdering?.payment_methods)
    || !latestOrdering.payment_methods.includes(paymentMethod);
  const belowMinimum = afterSubtotal < afterMinimum;

  return {
    priceChanged,
    minimumChanged,
    fulfillmentUnavailable,
    paymentUnavailable,
    belowMinimum,
    requiresReview: priceChanged || minimumChanged || fulfillmentUnavailable || paymentUnavailable || belowMinimum,
  };
};

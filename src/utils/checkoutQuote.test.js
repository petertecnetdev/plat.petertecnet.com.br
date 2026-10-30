import { reviewCheckoutConditions } from "./checkoutQuote";

const items = [
  { id: 10, price: "20.00" },
  { id: 20, price: "2.50", type: "modifier" },
];
const cart = { 10: { quantity: 2, additions: [20] } };
const ordering = {
  delivery_fee: "5.00", minimum_order: "30.00",
  fulfillment: { delivery: true, pickup: true },
  payment_methods: ["cash", "pix"],
};
const check = (changes = {}) => reviewCheckoutConditions({
  cart, currentItems: items, latestItems: items,
  currentOrdering: ordering, latestOrdering: ordering,
  fulfillment: "delivery", paymentMethod: "cash", ...changes,
});

describe("revisão das condições comerciais antes de enviar o pedido", () => {
  test("não bloqueia pedido quando nada mudou", () => {
    expect(check().requiresReview).toBe(false);
  });

  test("detecta alteração no preço do produto", () => {
    expect(check({ latestItems: [{ ...items[0], price: "21.00" }, items[1]] }).priceChanged).toBe(true);
  });

  test("detecta alteração no preço de adicional por unidade", () => {
    expect(check({ latestItems: [items[0], { ...items[1], price: "3.00" }] }).priceChanged).toBe(true);
  });

  test("detecta alteração da taxa de entrega", () => {
    expect(check({ latestOrdering: { ...ordering, delivery_fee: "7.00" } }).priceChanged).toBe(true);
  });

  test("não compara taxa de entrega quando cliente escolheu retirada", () => {
    expect(check({ fulfillment: "pickup", latestOrdering: { ...ordering, delivery_fee: "7.00" } }).requiresReview).toBe(false);
  });

  test("detecta mudança no pedido mínimo mesmo quando total ainda atende", () => {
    expect(check({ latestOrdering: { ...ordering, minimum_order: "35.00" } }).minimumChanged).toBe(true);
  });

  test("bloqueia pedido que passou a ficar abaixo do mínimo", () => {
    expect(check({ latestOrdering: { ...ordering, minimum_order: "60.00" } }).belowMinimum).toBe(true);
  });

  test("bloqueia forma de pagamento retirada pelo estabelecimento", () => {
    expect(check({ latestOrdering: { ...ordering, payment_methods: ["pix"] } }).paymentUnavailable).toBe(true);
  });

  test("bloqueia modalidade de entrega desabilitada", () => {
    expect(check({ latestOrdering: { ...ordering, fulfillment: { delivery: false, pickup: true } } }).fulfillmentUnavailable).toBe(true);
  });

  test("falha fechada para valores comerciais inválidos", () => {
    expect(check({ latestItems: [{ ...items[0], price: "inválido" }, items[1]] }).requiresReview).toBe(true);
  });
});

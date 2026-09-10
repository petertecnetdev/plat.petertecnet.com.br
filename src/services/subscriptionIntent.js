import api from "./api";

const APPLICATION = "plat";
const SOURCE = "subscription_plans";
const REQUEST_TIMEOUT_MS = 1200;

const storageKey = (planCode) =>
  `subscription_intent_idempotency:${APPLICATION}:${planCode}`;

const createKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export function getSubscriptionIntentIdempotencyKey(planCode) {
  const key = storageKey(planCode);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const created = createKey();
  sessionStorage.setItem(key, created);
  return created;
}

export async function createSubscriptionIntent({
  planCode,
  priceCents = null,
  currency = "BRL",
  source = SOURCE,
  handoff = "app",
  page,
}) {
  const token = localStorage.getItem("token");
  const normalizedPlanCode = String(planCode || "").trim();

  if (!token || !/^[a-z0-9_-]{1,80}$/i.test(normalizedPlanCode)) return null;

  const idempotencyKey = getSubscriptionIntentIdempotencyKey(normalizedPlanCode);

  try {
    const { data } = await api.post(
      `/v1/apps/${APPLICATION}/subscription-intents`,
      {
        plan_code: normalizedPlanCode,
        source,
        handoff_channel: handoff,
        metadata: {
          client_price_cents: priceCents,
          currency,
          page: page || window.location.pathname,
        },
      },
      {
        headers: { "Idempotency-Key": idempotencyKey },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return data?.data || null;
  } catch {
    return null;
  }
}

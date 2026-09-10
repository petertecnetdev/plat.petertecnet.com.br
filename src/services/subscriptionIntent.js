import api from "./api";

const APPLICATION = "plat";
const SOURCE = "subscription_plans";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;

const storageKey = (planCode) =>
  `subscription_intent_idempotency:${APPLICATION}:${planCode}`;

const checkoutStorageKey = (intentId) =>
  `subscription_checkout_idempotency:${APPLICATION}:${intentId}`;

const createKey = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const wait = (milliseconds) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const shouldRetry = (error) => {
  const status = Number(error?.response?.status || 0);

  if (!error?.response) return true;
  return status === 408 || status === 429 || status >= 500;
};

const readPendingAttribution = (planCode) => {
  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    if (pending?.application !== APPLICATION || pending?.plan !== planCode) return {};

    return {
      referral: String(pending?.referral || "").trim(),
      campaign: String(pending?.campaign || "").trim(),
    };
  } catch {
    return {};
  }
};

const getOrCreateSessionKey = (key) => {
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const created = createKey();
  sessionStorage.setItem(key, created);
  return created;
};

export function getSubscriptionIntentIdempotencyKey(planCode) {
  return getOrCreateSessionKey(storageKey(planCode));
}

export async function createSubscriptionIntent({
  planCode,
  priceCents = null,
  currency = "BRL",
  source = SOURCE,
  handoff = "app",
  page,
  referral = "",
  campaign = "",
}) {
  const token = localStorage.getItem("token");
  const normalizedPlanCode = String(planCode || "").trim();

  if (!token || !/^[a-z0-9_-]{1,80}$/i.test(normalizedPlanCode)) return null;

  const pendingAttribution = readPendingAttribution(normalizedPlanCode);
  const resolvedReferral = String(referral || pendingAttribution.referral || "").trim();
  const resolvedCampaign = String(campaign || pendingAttribution.campaign || "").trim();
  const idempotencyKey = getSubscriptionIntentIdempotencyKey(normalizedPlanCode);
  const metadata = {
    client_price_cents: priceCents,
    currency,
    page: page || window.location.pathname,
  };

  if (resolvedReferral) metadata.referral = resolvedReferral;
  if (resolvedCampaign) metadata.campaign = resolvedCampaign;

  const payload = {
    plan_code: normalizedPlanCode,
    source,
    handoff_channel: handoff,
    metadata,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post(
        `/v1/apps/${APPLICATION}/subscription-intents`,
        payload,
        {
          headers: { "Idempotency-Key": idempotencyKey },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      return data?.data || null;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) return null;
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

export async function createSubscriptionPixCheckout(intentId) {
  const normalizedIntentId = String(intentId || "").trim();
  if (!normalizedIntentId) return null;

  const idempotencyKey = getOrCreateSessionKey(checkoutStorageKey(normalizedIntentId));

  try {
    const { data } = await api.post(
      `/v1/apps/${APPLICATION}/subscription-intents/${encodeURIComponent(normalizedIntentId)}/checkout`,
      { method: "pix" },
      {
        headers: { "Idempotency-Key": idempotencyKey },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    return data || null;
  } catch {
    return null;
  }
}

export async function syncSubscriptionPayment(intentId) {
  const normalizedIntentId = String(intentId || "").trim();
  if (!normalizedIntentId) return null;

  try {
    const { data } = await api.post(
      `/v1/apps/${APPLICATION}/subscription-intents/${encodeURIComponent(normalizedIntentId)}/sync`,
      {},
      { timeout: REQUEST_TIMEOUT_MS }
    );

    return data || null;
  } catch (error) {
    return error?.response?.data || null;
  }
}

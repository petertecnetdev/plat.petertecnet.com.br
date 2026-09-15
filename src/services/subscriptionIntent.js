import api from "./api";
import { trackTelemetryEvent } from "../telemetry";
import {
  buildSubscriptionRecoveryUrl,
  safeSubscriptionReturnTo,
} from "../utils/subscriptionRecovery";

const APPLICATION = "plat";
const SOURCE = "subscription_plans";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 250;
const TERMINAL_PAYMENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "expired",
  "failed",
  "rejected",
  "refunded",
  "charged_back",
  "chargeback",
]);
const REUSABLE_PIX_PAYMENT_STATUSES = new Set(["cancelled", "rejected"]);

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

const httpStatus = (error) => Number(error?.response?.status || 0) || "network";

const trackRevenue = (type, metadata = {}) => {
  trackTelemetryEvent(type, {
    label: "Assinatura Plat",
    target: "subscription",
    metadata: {
      application: APPLICATION,
      ...metadata,
    },
  });
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();
const normalizeRetryStatus = (value) => {
  const status = normalizeStatus(value);
  return status === "canceled" ? "cancelled" : status;
};

const returnToFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return safeSubscriptionReturnTo(params.get("return_to"));
};

const restoreReturnToFromIntent = (intent) => {
  if (returnToFromLocation()) return "url";

  const returnTo = safeSubscriptionReturnTo(intent?.metadata?.return_to);
  if (!returnTo) return "";

  try {
    const url = new URL(window.location.href);
    url.searchParams.set("return_to", returnTo);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    return "intent_metadata";
  } catch {
    return "";
  }
};

const persistPendingReturnTo = (planCode, returnTo) => {
  const safeReturnTo = safeSubscriptionReturnTo(returnTo);
  if (!safeReturnTo) return;

  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    if (pending?.application !== APPLICATION || pending?.plan !== planCode) return;

    localStorage.setItem(
      "pending_subscription_plan",
      JSON.stringify({ ...pending, return_to: safeReturnTo })
    );
  } catch {
    // Recovery can still continue from the current URL if local storage is unavailable.
  }
};

const terminalPaymentStatus = (data) => {
  const candidates = [
    data?.payment?.status,
    data?.intent?.status,
    data?.subscription?.status,
    data?.status,
  ].map(normalizeStatus).filter(Boolean);

  return candidates.find((status) => TERMINAL_PAYMENT_STATUSES.has(status)) || "";
};

export const canReuseTerminalSubscriptionIntent = (pending, intentId, status) => {
  const planCode = String(pending?.plan || "").trim().toLowerCase();
  const pendingIntentId = String(pending?.intent_id || "").trim();
  const normalizedIntentId = String(intentId || "").trim();
  const retryStatus = normalizeRetryStatus(status);

  return pending?.application === APPLICATION
    && /^[a-z0-9_-]{1,80}$/i.test(planCode)
    && Boolean(normalizedIntentId)
    && pendingIntentId === normalizedIntentId
    && REUSABLE_PIX_PAYMENT_STATUSES.has(retryStatus);
};

const recoverFromTerminalPayment = (intentId, status) => {
  let pending = null;

  try {
    pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
  } catch {
    pending = null;
  }

  const planCode = String(pending?.plan || "").trim().toLowerCase();
  const validPlanCode = /^[a-z0-9_-]{1,80}$/i.test(planCode);
  const referral = String(pending?.referral || "").trim();
  const campaign = String(pending?.campaign || "").trim();
  const locationReturnTo = returnToFromLocation();
  const pendingReturnTo = safeSubscriptionReturnTo(pending?.return_to);
  const returnTo = locationReturnTo || pendingReturnTo;
  const reusableIntent = canReuseTerminalSubscriptionIntent(pending, intentId, status);

  sessionStorage.removeItem(checkoutStorageKey(intentId));

  if (reusableIntent) {
    const nextPending = {
      ...pending,
      intent_id: String(intentId).trim(),
      intent_status: normalizeRetryStatus(status),
      ...(returnTo ? { return_to: returnTo } : {}),
    };
    localStorage.setItem("pending_subscription_plan", JSON.stringify(nextPending));
  } else {
    // Expired/failed/reversed payments are not retryable on the same aggregate in the
    // billing API. Clear the intent idempotency state so recovery creates a fresh intent.
    if (validPlanCode) sessionStorage.removeItem(storageKey(planCode));
    localStorage.removeItem("pending_subscription_plan");
  }

  trackRevenue("subscription_payment_recovery_started", {
    method: "pix",
    terminal_status: status,
    plan: validPlanCode ? planCode : undefined,
    referral: referral || undefined,
    campaign: campaign || undefined,
    intent_reused: reusableIntent,
    return_to_preserved: Boolean(returnTo),
    return_to_source: returnTo ? (locationReturnTo ? "url" : "pending_subscription") : undefined,
  });

  if (!validPlanCode) return;

  const recoveryUrl = buildSubscriptionRecoveryUrl({
    planCode,
    referral,
    campaign,
    returnTo,
  });

  if (recoveryUrl) window.location.assign(recoveryUrl);
};

const readPendingAttribution = (planCode) => {
  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    if (pending?.application !== APPLICATION || pending?.plan !== planCode) return {};

    return {
      referral: String(pending?.referral || "").trim(),
      campaign: String(pending?.campaign || "").trim(),
      returnTo: safeSubscriptionReturnTo(pending?.return_to),
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

export async function getRecoverableSubscriptionIntent() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.get(
        `/v1/apps/${APPLICATION}/subscription-intents/recoverable`,
        { timeout: REQUEST_TIMEOUT_MS }
      );

      const intent = data?.data || null;
      if (intent) {
        const returnToSource = restoreReturnToFromIntent(intent);
        trackRevenue("subscription_intent_recovered", {
          plan: intent.plan_code,
          status: intent.status,
          source: intent.source,
          price_cents: intent.price_cents,
          return_to_preserved: Boolean(returnToSource),
          return_to_source: returnToSource || undefined,
          attempt,
        });
      }

      return intent;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_recovery_failed", {
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
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
  const resolvedReturnTo = returnToFromLocation() || pendingAttribution.returnTo || "";
  const idempotencyKey = getSubscriptionIntentIdempotencyKey(normalizedPlanCode);
  const metadata = {
    client_price_cents: priceCents,
    currency,
    page: page || window.location.pathname,
  };

  if (resolvedReferral) metadata.referral = resolvedReferral;
  if (resolvedCampaign) metadata.campaign = resolvedCampaign;
  if (resolvedReturnTo) {
    metadata.return_to = resolvedReturnTo;
    persistPendingReturnTo(normalizedPlanCode, resolvedReturnTo);
  }

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

      const intent = data?.data || null;
      if (intent) {
        trackRevenue("subscription_intent_created", {
          plan: normalizedPlanCode,
          status: intent.status,
          source,
          price_cents: intent.price_cents ?? priceCents,
          currency: intent.currency || currency,
          referral: resolvedReferral || undefined,
          campaign: resolvedCampaign || undefined,
          return_to_preserved: Boolean(resolvedReturnTo),
          attempt,
        });
      } else {
        trackRevenue("subscription_intent_failed", {
          plan: normalizedPlanCode,
          source,
          reason: "empty_response",
          attempt,
        });
      }

      return intent;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_intent_failed", {
          plan: normalizedPlanCode,
          source,
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
}

export async function createSubscriptionPixCheckout(intentId) {
  const normalizedIntentId = String(intentId || "").trim();
  if (!normalizedIntentId) return null;

  const idempotencyKey = getOrCreateSessionKey(checkoutStorageKey(normalizedIntentId));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await api.post(
        `/v1/apps/${APPLICATION}/subscription-intents/${encodeURIComponent(normalizedIntentId)}/checkout`,
        { method: "pix" },
        {
          headers: { "Idempotency-Key": idempotencyKey },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      if (data?.payment?.pix?.qr_code) {
        trackRevenue("subscription_checkout_ready", {
          method: "pix",
          status: data?.payment?.status || data?.intent?.status || "ready",
          attempt,
        });
      } else {
        trackRevenue("subscription_checkout_failed", {
          method: "pix",
          reason: "missing_pix_payload",
          attempt,
        });
      }

      return data || null;
    } catch (error) {
      const lastAttempt = attempt >= MAX_ATTEMPTS;
      if (lastAttempt || !shouldRetry(error)) {
        trackRevenue("subscription_checkout_failed", {
          method: "pix",
          http_status: httpStatus(error),
          retryable: shouldRetry(error),
          attempt,
        });
        return null;
      }
      await wait(RETRY_DELAY_MS * attempt);
    }
  }

  return null;
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

    const subscriptionStatus = data?.subscription?.status || "";
    const entitlementStatus = data?.entitlement?.status || "";
    if (subscriptionStatus === "active" && entitlementStatus === "active") {
      trackRevenue("subscription_activated", {
        method: "pix",
        subscription_status: subscriptionStatus,
        entitlement_status: entitlementStatus,
      });
      return data || null;
    }

    const terminalStatus = terminalPaymentStatus(data);
    if (terminalStatus) {
      recoverFromTerminalPayment(normalizedIntentId, terminalStatus);
    }

    return data || null;
  } catch (error) {
    return error?.response?.data || null;
  }
}

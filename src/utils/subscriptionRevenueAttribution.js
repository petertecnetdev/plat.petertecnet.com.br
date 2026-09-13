const APPLICATION = "plat";
const PENDING_KEY = "pending_subscription_plan";
const MAX_PENDING_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RECOVERY_SOURCES = new Set(["payment_recovery", "upgrade_required", "signup_resume"]);

const clean = (value, limit = 80) => String(value || "").trim().slice(0, limit);

const readFreshPending = (storage, now = Date.now()) => {
  if (!storage?.getItem) return null;

  try {
    const pending = JSON.parse(storage.getItem(PENDING_KEY) || "null");
    if (pending?.application !== APPLICATION) return null;

    const selectedAt = pending?.selected_at ? Date.parse(pending.selected_at) : NaN;
    if (!Number.isFinite(selectedAt) || now - selectedAt > MAX_PENDING_AGE_MS) return null;

    return pending;
  } catch {
    return null;
  }
};

export function buildSubscriptionRevenueAttribution({ search = "", storage, now = Date.now() } = {}) {
  const params = new URLSearchParams(search || "");
  const pending = readFreshPending(storage, now);
  const entrySource = clean(params.get("source") || pending?.source);
  const originalSource = clean(pending?.source || entrySource);
  const referral = clean(params.get("ref") || params.get("referral") || pending?.referral);
  const campaign = clean(params.get("utm_campaign") || pending?.campaign);
  const plan = clean(params.get("plan") || pending?.plan);
  const recoverySource = RECOVERY_SOURCES.has(entrySource) ? entrySource : "";

  return {
    ...(plan ? { plan } : {}),
    ...(originalSource ? { original_source: originalSource } : {}),
    ...(entrySource ? { entry_source: entrySource } : {}),
    ...(recoverySource ? { recovery_source: recoverySource, recovery_flow: true } : {}),
    ...(referral ? { referral } : {}),
    ...(campaign ? { campaign } : {}),
  };
}

export function installSubscriptionRevenueAttribution() {
  if (typeof window === "undefined" || window.__platSubscriptionRevenueAttributionInstalled) return;

  const onTelemetry = (event) => {
    const type = String(event?.detail?.type || "").trim();
    if (!type.startsWith("subscription_")) return;

    const details = event.detail.details || {};
    const metadata = details.metadata || {};
    const attribution = buildSubscriptionRevenueAttribution({
      search: window.location.search,
      storage: window.localStorage,
    });

    event.detail.details = {
      ...details,
      metadata: {
        ...attribution,
        ...metadata,
      },
    };
  };

  window.addEventListener("peter:telemetry", onTelemetry);
  window.__platSubscriptionRevenueAttributionInstalled = true;
}

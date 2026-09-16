const STORAGE_KEY = "plat_acquisition_attribution";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LENGTH = 80;

const safeValue = (value) => {
  const normalized = String(value || "").trim().slice(0, MAX_LENGTH);
  return /^[a-z0-9._-]+$/i.test(normalized) ? normalized : "";
};

const normalizeAttribution = (value = {}) => ({
  source: safeValue(value.source),
  referral: safeValue(value.referral || value.ref),
  utm_source: safeValue(value.utm_source),
  utm_medium: safeValue(value.utm_medium),
  utm_campaign: safeValue(value.utm_campaign),
});

const parseStoredAttribution = (storage) => {
  try {
    const stored = JSON.parse(storage?.getItem(STORAGE_KEY) || "null");
    const capturedAt = stored?.captured_at ? Date.parse(stored.captured_at) : NaN;
    if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > TTL_MS) {
      storage?.removeItem(STORAGE_KEY);
      return {};
    }
    return normalizeAttribution(stored);
  } catch {
    return {};
  }
};

const readStoredAttribution = () => {
  // Acquisition can span more than one browser session (SEO visit -> signup ->
  // establishment setup later). localStorage keeps the original 7-day intent
  // window while sessionStorage remains a compatibility fallback for users who
  // started onboarding before this persistence change.
  const persistent = parseStoredAttribution(window.localStorage);
  if (persistent.source) return persistent;

  const legacy = parseStoredAttribution(window.sessionStorage);
  if (legacy.source) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...legacy, captured_at: new Date().toISOString() })
      );
    } catch {
      // Hardened browsers can deny persistent storage; keep the legacy value.
    }
  }
  return legacy;
};

const persistAttribution = (attribution) => {
  const payload = JSON.stringify({ ...attribution, captured_at: new Date().toISOString() });
  let persisted = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, payload);
    persisted = true;
  } catch {
    // Storage can be unavailable in hardened browsers and embedded webviews.
  }

  if (!persisted) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, payload);
    } catch {
      // Attribution is best-effort and must never block signup/onboarding.
    }
  }
};

export const captureAcquisitionAttribution = (fallback = {}) => {
  const stored = readStoredAttribution();
  const params = new URLSearchParams(window.location.search);
  const query = normalizeAttribution({
    source: params.get("source"),
    referral: params.get("ref") || params.get("referral"),
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  });
  const fallbackAttribution = normalizeAttribution(fallback);
  const attribution = {
    source: query.source || fallbackAttribution.source || stored.source || "",
    referral: query.referral || fallbackAttribution.referral || stored.referral || "",
    utm_source: query.utm_source || fallbackAttribution.utm_source || stored.utm_source || "",
    utm_medium: query.utm_medium || fallbackAttribution.utm_medium || stored.utm_medium || "",
    utm_campaign: query.utm_campaign || fallbackAttribution.utm_campaign || stored.utm_campaign || "",
  };

  if (attribution.source) persistAttribution(attribution);

  return attribution;
};

export const acquisitionTelemetryMetadata = (attribution = {}) => {
  const normalized = normalizeAttribution(attribution);
  return Object.fromEntries(
    Object.entries({
      acquisition_source: normalized.source,
      acquisition_referral: normalized.referral,
      utm_source: normalized.utm_source,
      utm_medium: normalized.utm_medium,
      utm_campaign: normalized.utm_campaign,
    }).filter(([, value]) => Boolean(value))
  );
};

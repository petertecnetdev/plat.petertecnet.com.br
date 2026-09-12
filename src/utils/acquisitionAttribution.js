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

const readStoredAttribution = () => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    const capturedAt = stored?.captured_at ? Date.parse(stored.captured_at) : NaN;
    if (!Number.isFinite(capturedAt) || Date.now() - capturedAt > TTL_MS) return {};
    return normalizeAttribution(stored);
  } catch {
    return {};
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

  if (attribution.source) {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...attribution, captured_at: new Date().toISOString() })
      );
    } catch {
      // Storage can be unavailable in hardened browsers and embedded webviews.
    }
  }

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

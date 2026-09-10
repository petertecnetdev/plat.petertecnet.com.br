// src/services/api.js
import axios from "axios";
import { apiBaseUrl } from "../config";

const APP_SLUG = "plat";
const FALLBACK_ORIGIN = "https://plat.petertecnet.com.br";

const ENTITLEMENT_UPGRADE_PLAN = Object.freeze({
  "tables.management": "pro",
  "tabs.management": "pro",
  "staff.management": "pro",
  "analytics.reports": "pro",
  "automation.rules": "pro",
  "establishments.max": "business",
  "establishments.multiple": "business",
  "management.advanced": "business",
  "features.premium": "business",
  "integration.nexus": "business",
});

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || apiBaseUrl,
  headers: {
    Accept: "application/json",
    "X-Peter-App": APP_SLUG,
  },
  timeout: 20000,
});

function isTrustedApiRequest(config) {
  const requestUrl = String(config?.url || "");
  if (!requestUrl) return true;

  try {
    const runtimeOrigin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : FALLBACK_ORIGIN;
    const configuredBaseUrl = String(config?.baseURL || api.defaults.baseURL || apiBaseUrl);
    const apiUrl = new URL(configuredBaseUrl, runtimeOrigin);
    const targetUrl = new URL(requestUrl, apiUrl);

    return targetUrl.origin === apiUrl.origin;
  } catch {
    return false;
  }
}

function redirectUpgradeRequired(error) {
  if (typeof window === "undefined" || !isTrustedApiRequest(error?.config)) return false;

  const payload = error?.response?.data;
  const entitlement = String(payload?.upgrade?.entitlement || "").trim();

  if (error?.response?.status !== 402 || payload?.error !== "upgrade_required") return false;

  const targetPlan = ENTITLEMENT_UPGRADE_PLAN[entitlement];
  if (!targetPlan) return false;
  if (window.location.pathname === "/planos") return false;

  const upgradeContext = {
    application: APP_SLUG,
    entitlement,
    current: payload?.upgrade?.current ?? null,
    limit: payload?.upgrade?.limit ?? null,
    current_plan: payload?.upgrade?.plan_code || null,
    target_plan: targetPlan,
    captured_at: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem("pending_upgrade_context", JSON.stringify(upgradeContext));
  } catch {
    // Storage is best-effort; the redirect itself is the revenue-critical behavior.
  }

  const params = new URLSearchParams({
    plan: targetPlan,
    resume: "1",
    source: "upgrade_required",
    entitlement,
  });
  window.location.assign(`/planos?${params.toString()}`);
  return true;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const trustedApiRequest = isTrustedApiRequest(config);

  config.headers = config.headers || {};

  if (trustedApiRequest) {
    config.headers["X-Peter-App"] = APP_SLUG;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
    delete config.headers.authorization;
    delete config.headers["X-Peter-App"];
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  } else if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = String(error?.config?.url || "");
    const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/google");

    if (error?.response?.status === 401 && !isAuthAttempt && isTrustedApiRequest(error?.config)) {
      const hadToken = Boolean(localStorage.getItem("token"));
      localStorage.removeItem("token");
      if (hadToken && typeof window !== "undefined") window.dispatchEvent(new Event("authChanged"));
    }

    redirectUpgradeRequired(error);
    return Promise.reject(error);
  }
);

export { isTrustedApiRequest };
export default api;

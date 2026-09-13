const MAX_RETURN_TO_LENGTH = 1000;

export const safeSubscriptionReturnTo = (value, origin = window.location.origin) => {
  const candidate = String(value || "").trim();
  if (!candidate || candidate.length > MAX_RETURN_TO_LENGTH) return "";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return "";

  if ([...candidate].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  })) return "";

  try {
    const target = new URL(candidate, origin);
    if (target.origin !== origin || target.pathname === "/planos") return "";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "";
  }
};

export const buildSubscriptionRecoveryUrl = ({
  planCode,
  referral = "",
  campaign = "",
  returnTo = "",
  origin = window.location.origin,
}) => {
  const plan = String(planCode || "").trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,80}$/i.test(plan)) return "";

  const params = new URLSearchParams({
    plan,
    resume: "1",
    source: "payment_recovery",
  });

  const normalizedReferral = String(referral || "").trim().slice(0, 80);
  const normalizedCampaign = String(campaign || "").trim().slice(0, 80);
  const safeReturnTo = safeSubscriptionReturnTo(returnTo, origin);

  if (normalizedReferral) params.set("ref", normalizedReferral);
  if (normalizedCampaign) params.set("utm_campaign", normalizedCampaign);
  if (safeReturnTo) params.set("return_to", safeReturnTo);

  return `/planos?${params.toString()}`;
};

export const buildSubscriptionSuccessUrl = ({
  returnTo = "",
  origin = window.location.origin,
} = {}) => {
  const safeReturnTo = safeSubscriptionReturnTo(returnTo, origin);
  if (!safeReturnTo) return "/dashboard?subscription=active";

  try {
    const target = new URL(safeReturnTo, origin);
    target.searchParams.set("subscription", "active");
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/dashboard?subscription=active";
  }
};

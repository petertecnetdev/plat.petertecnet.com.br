import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import AuthShell from "../../components/auth/AuthShell";

const PENDING_PLAN_KEY = "pending_subscription_plan";
const PENDING_PLAN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SAFE_PLAN_CODE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

const safeInternalPath = (value) => {
  if (!value || typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/dashboard";
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
};

const pendingSubscriptionPath = () => {
  try {
    const raw = localStorage.getItem(PENDING_PLAN_KEY);
    if (!raw) return null;

    const pending = JSON.parse(raw);
    const selectedAt = Date.parse(pending?.selected_at || "");
    const isFresh = Number.isFinite(selectedAt) && Date.now() - selectedAt <= PENDING_PLAN_TTL_MS;
    const isPlat = pending?.application === "plat";
    const planCode = typeof pending?.plan === "string" ? pending.plan.trim() : "";

    if (!isFresh || !isPlat || !SAFE_PLAN_CODE.test(planCode)) {
      localStorage.removeItem(PENDING_PLAN_KEY);
      return null;
    }

    return `/dashboard?plan=${encodeURIComponent(planCode)}`;
  } catch {
    localStorage.removeItem(PENDING_PLAN_KEY);
    return null;
  }
};

export default function LoginPage() {
  const [params] = useSearchParams();
  const explicitRedirect = params.get("redirect");
  const redirectTo = explicitRedirect
    ? safeInternalPath(explicitRedirect)
    : pendingSubscriptionPath() || "/dashboard";

  const registerTarget = redirectTo !== "/dashboard"
    ? `/register?redirect=${encodeURIComponent(redirectTo)}`
    : "/register";

  return (
    <AuthShell
      eyebrow="Acesso à Plat"
      title="Bem-vindo de volta"
      description="Entre para gerenciar sua operação ou continuar seu pedido em um restaurante da Plat."
      footer={<p>Novo na Plat? <Link to={registerTarget}>Crie sua conta</Link></p>}
    >
      <LoginFormComponent redirectTo={redirectTo} />
    </AuthShell>
  );
}

import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import AuthShell from "../../components/auth/AuthShell";

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

export default function LoginPage() {
  const [params] = useSearchParams();
  const redirectTo = safeInternalPath(params.get("redirect"));

  return (
    <AuthShell
      eyebrow="Acesso à Plat"
      title="Bem-vindo de volta"
      description="Entre para gerenciar sua operação ou continuar seu pedido em um restaurante da Plat."
      footer={<p>Novo na Plat? <Link to="/register">Crie sua conta</Link></p>}
    >
      <LoginFormComponent redirectTo={redirectTo} />
    </AuthShell>
  );
}

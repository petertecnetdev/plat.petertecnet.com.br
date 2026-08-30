import React from "react";
import { useSearchParams } from "react-router-dom";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import AuthShell from "../../components/auth/AuthShell";

export default function LoginPage() {
  const [params] = useSearchParams();
  const requested = params.get("redirect");
  const redirectTo = requested && requested.startsWith("/") ? requested : "/dashboard";

  return (
    <AuthShell
      eyebrow="Acesso à Plat"
      title="Bem-vindo de volta"
      description="Entre para gerenciar sua operação ou continuar seu pedido em um restaurante da Plat."
      footer={<p>Novo na Plat? <a href="/register">Crie sua conta</a></p>}
    >
      <LoginFormComponent redirectTo={redirectTo} />
    </AuthShell>
  );
}

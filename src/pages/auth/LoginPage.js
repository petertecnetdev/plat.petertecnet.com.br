import React from "react";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import AuthShell from "../../components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Acesso ao sistema"
      title="Bem-vindo de volta"
      description="Entre para acompanhar sua operação, seus estabelecimentos, pedidos, atendimentos e indicadores."
      footer={<p>Novo na Plat? <a href="/register">Crie sua conta</a></p>}
    >
      <LoginFormComponent redirectTo="/dashboard" />
    </AuthShell>
  );
}

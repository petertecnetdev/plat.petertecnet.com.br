import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import authService from "../../services/AuthService";
import { Form, Button } from "react-bootstrap";
import LoadingComponent from "../../components/LoadingComponent";
import AuthShell from "../../components/auth/AuthShell";

const EmailVerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoadingVerify(true);
    try {
      const emailVerified = await authService.emailVerify(verificationCode);
      if (emailVerified) {
        Swal.fire({
          icon: "success",
          title: "E-mail verificado",
          text: "Sua conta foi confirmada com sucesso.",
          customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
        });
        setTimeout(() => setRedirect(true), 1200);
      } else {
        Swal.fire({
          icon: "error",
          title: "Código inválido",
          text: "Confira o código informado e tente novamente.",
          customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
        });
      }
    } catch (error) {
      let message = "Não foi possível verificar seu e-mail agora.";
      if (error.response?.data?.errors) {
        message = Object.values(error.response.data.errors).flat().join(" ");
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      Swal.fire({
        icon: "error",
        title: "Erro na verificação",
        text: message,
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResendVerificationCode = async () => {
    setLoadingResend(true);
    try {
      const codeResent = await authService.resendCodeEmailVerification();
      Swal.fire({
        icon: codeResent ? "success" : "error",
        title: codeResent ? "Código reenviado" : "Não foi possível reenviar",
        text: codeResent ? "Enviamos um novo código para seu e-mail." : "Tente novamente em alguns instantes.",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Não foi possível reenviar",
        text: error.response?.data?.message || "Tente novamente mais tarde.",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
    } finally {
      setLoadingResend(false);
    }
  };

  if (redirect) return <Navigate to="/dashboard" />;

  return (
    <>
      <AuthShell
        compact
        eyebrow="Confirmação da conta"
        title="Verifique seu e-mail"
        description="Digite o código que enviamos para confirmar sua conta e liberar o acesso completo à Plat."
        footer={<p>O código não chegou? Você pode solicitar um novo abaixo.</p>}
      >
        <Form onSubmit={handleVerifyEmail} className="form-container">
          <Form.Group className="form-group">
            <Form.Label>Código de verificação</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Digite o código recebido"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </Form.Group>
          <Button type="submit" variant="primary" disabled={loadingVerify || loadingResend}>
            {loadingVerify ? "Verificando..." : "Confirmar e-mail"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleResendVerificationCode} disabled={loadingVerify || loadingResend} className="mt-2">
            {loadingResend ? "Reenviando..." : "Reenviar código"}
          </Button>
        </Form>
      </AuthShell>
      {(loadingVerify || loadingResend) && <LoadingComponent />}
    </>
  );
};

export default EmailVerifyPage;

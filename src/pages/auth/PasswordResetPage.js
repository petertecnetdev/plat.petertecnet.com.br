import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import AuthShell from "../../components/auth/AuthShell";

const PasswordResetPage = () => {
  const [email, setEmail] = useState("");
  const [resetPasswordCode, setResetPasswordCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "Senhas diferentes",
        text: "A confirmação precisa ser igual à nova senha.",
        icon: "error",
        confirmButtonText: "Corrigir",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-reset`, {
        email,
        reset_password_code: resetPasswordCode,
        password: newPassword,
      });

      Swal.fire({
        title: "Senha atualizada",
        text: response.data.message || "Sua senha foi alterada com sucesso.",
        icon: "success",
        confirmButtonText: "Entrar",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      }).then(() => { window.location.href = "/login"; });
    } catch (error) {
      Swal.fire({
        title: "Não foi possível alterar",
        text: error.response?.data?.message || "Ocorreu um erro inesperado.",
        icon: "error",
        confirmButtonText: "Tentar novamente",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <ProcessingIndicatorComponent messages={["Redefinindo senha...", "Por favor, aguarde..."]} />}
      {!loading && (
        <AuthShell
          eyebrow="Nova senha"
          title="Redefina seu acesso"
          description="Informe o e-mail, o código recebido e escolha uma nova senha para concluir a recuperação."
          footer={(
            <>
              <p>Não recebeu o código? <a href="/password-email">Solicitar novamente</a></p>
              <p>Já consegue acessar? <a href="/login">Voltar para o login</a></p>
            </>
          )}
        >
          <Form onSubmit={handleSubmit} className="form-container">
            <Form.Group className="form-group">
              <Form.Control type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Control type="text" placeholder="Código de recuperação" value={resetPasswordCode} onChange={(e) => setResetPasswordCode(e.target.value)} required />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Control type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </Form.Group>
            <Form.Group className="form-group">
              <Form.Control type="password" placeholder="Confirme a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </Form.Group>
            <Button type="submit" className="submit-btn" disabled={loading}>Salvar nova senha</Button>
          </Form>
        </AuthShell>
      )}
    </>
  );
};

export default PasswordResetPage;

import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import AuthShell from "../../components/auth/AuthShell";

const PasswordEmailPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (targetEmail) => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/password-email`, { email: targetEmail });

      Swal.fire({
        title: "Código enviado",
        text: response.data.message || "Enviamos um código para seu e-mail. Verifique sua caixa de entrada.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Recebi o código",
        cancelButtonText: "Reenviar",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/password-reset";
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          sendCode(targetEmail);
        }
      });
    } catch (error) {
      Swal.fire({
        title: "Não foi possível enviar",
        text: error.response?.data?.message || "Ocorreu um erro inesperado.",
        icon: "error",
        confirmButtonText: "Tentar novamente",
        customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendCode(email);
  };

  return (
    <>
      {loading && <ProcessingIndicatorComponent messages={["Enviando código...", "Por favor, aguarde..."]} />}
      {!loading && (
        <AuthShell
          compact
          eyebrow="Recuperação de acesso"
          title="Recupere sua senha"
          description="Informe o e-mail da sua conta. Enviaremos um código para confirmar sua identidade e criar uma nova senha."
          footer={<p>Lembrou sua senha? <a href="/login">Voltar para o login</a></p>}
        >
          <Form onSubmit={handleSubmit} className="form-container">
            <Form.Group className="form-group">
              <Form.Control
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Form.Group>
            <Button type="submit" className="submit-btn" disabled={loading}>
              Enviar código de recuperação
            </Button>
            <p className="plat-auth__note">Por segurança, o código deve ser utilizado apenas por você.</p>
          </Form>
        </AuthShell>
      )}
    </>
  );
};

export default PasswordEmailPage;

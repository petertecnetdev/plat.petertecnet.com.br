import React, { Component } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import AuthShell from "../../components/auth/AuthShell";

const safeInternalPath = (value) => {
  if (!value || typeof value !== "string") return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "";
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "";
  } catch {
    return "";
  }
};

const postRegisterLoginTarget = () => {
  const params = new URLSearchParams(window.location.search);
  const explicitRedirect = safeInternalPath(params.get("redirect"));
  if (explicitRedirect) return `/login?redirect=${encodeURIComponent(explicitRedirect)}`;

  const plan = String(params.get("plan") || "").trim();
  if (/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(plan)) {
    const resumePath = `/planos?plan=${encodeURIComponent(plan)}&resume=1&source=signup_resume`;
    return `/login?redirect=${encodeURIComponent(resumePath)}`;
  }

  return "/login";
};

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = { first_name: "", email: "", password: "", confirmPassword: "", loading: false };
  }

  onChangeFirstName = (e) => this.setState({ first_name: e.target.value });
  onChangeEmail = (e) => this.setState({ email: e.target.value });
  onChangePassword = (e) => this.setState({ password: e.target.value });
  onChangeConfirmPassword = (e) => this.setState({ confirmPassword: e.target.value });

  onSubmit = async (e) => {
    e.preventDefault();
    const { first_name, email, password, confirmPassword } = this.state;

    if (password !== confirmPassword) {
      Swal.fire({ title: "Erro!", text: "As senhas não coincidem. Por favor, tente novamente.", icon: "error", confirmButtonText: "Ok", iconColor: "#dc3545", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } });
      return;
    }

    this.setState({ loading: true });
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/register`, { first_name, email, password });
      const modalMessage = response?.data?.message || "Registro bem-sucedido";
      Swal.fire({ title: "Sucesso!", text: modalMessage, icon: "success", confirmButtonText: "Ok", iconColor: "#28a745", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } })
        .then(() => { window.location.href = postRegisterLoginTarget(); });
    } catch (error) {
      let errorMessages = "";
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.email) errorMessages += `${errors.email[0]} `;
        if (errors.first_name) errorMessages += `${errors.first_name[0]} `;
        if (errors.password) errorMessages += `${errors.password[0]} `;
      } else {
        errorMessages = error.response?.data?.message || "Erro desconhecido ao tentar se registrar.";
      }
      Swal.fire({ title: "Erro!", text: errorMessages, icon: "error", confirmButtonText: "Ok", iconColor: "#dc3545", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, first_name, email, password, confirmPassword } = this.state;
    return (
      <>
        {loading && <ProcessingIndicatorComponent messages={["Registrando usuário...", "Por favor, aguarde..."]} />}
        {!loading && (
          <AuthShell eyebrow="Nova conta" title="Comece na Plat" description="Crie sua conta para organizar seus estabelecimentos e centralizar sua operação em um só lugar." footer={<><p>Já possui uma conta? <a href="/login">Entrar</a></p><p>Esqueceu sua senha? <a href="/password-email">Recuperar senha</a></p></>}>
            <Form onSubmit={this.onSubmit} className="form-container">
              <Form.Group className="form-group"><Form.Control type="text" placeholder="Seu nome" onChange={this.onChangeFirstName} value={first_name} required /></Form.Group>
              <Form.Group className="form-group"><Form.Control type="email" placeholder="Seu e-mail" onChange={this.onChangeEmail} value={email} required /></Form.Group>
              <Form.Group className="form-group"><Form.Control type="password" placeholder="Crie uma senha" onChange={this.onChangePassword} value={password} required /></Form.Group>
              <Form.Group className="form-group"><Form.Control type="password" placeholder="Confirme sua senha" onChange={this.onChangeConfirmPassword} value={confirmPassword} required /></Form.Group>
              <Button type="submit" disabled={loading} className="submit-btn">Criar minha conta</Button>
            </Form>
          </AuthShell>
        )}
      </>
    );
  }
}

export default RegisterPage;

import React, { Component } from "react";
import axios from "axios";
import { Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../services/api";
import { trackTelemetryEvent } from "../../telemetry";
import { acquisitionTelemetryMetadata, captureAcquisitionAttribution } from "../../utils/acquisitionAttribution";

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

const safeAttributionValue = (value) => {
  const normalized = String(value || "").trim().slice(0, 80);
  return /^[a-z0-9._-]+$/i.test(normalized) ? normalized : "";
};

const acquisitionOnboardingPath = (params) => {
  const source = safeAttributionValue(params.get("source"));
  if (!source) return "";
  const query = new URLSearchParams({ source });
  const referral = safeAttributionValue(params.get("ref") || params.get("referral"));
  const utmSource = safeAttributionValue(params.get("utm_source"));
  const utmMedium = safeAttributionValue(params.get("utm_medium"));
  const utmCampaign = safeAttributionValue(params.get("utm_campaign"));
  if (referral) query.set("ref", referral);
  if (utmSource) query.set("utm_source", utmSource);
  if (utmMedium) query.set("utm_medium", utmMedium);
  if (utmCampaign) query.set("utm_campaign", utmCampaign);
  return `/establishment/create?${query.toString()}`;
};

const postRegisterDestination = () => {
  const params = new URLSearchParams(window.location.search);
  const explicitRedirect = safeInternalPath(params.get("redirect"));
  if (explicitRedirect) return explicitRedirect;
  const plan = String(params.get("plan") || "").trim();
  if (/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(plan)) return `/planos?plan=${encodeURIComponent(plan)}&resume=1&source=signup_resume`;
  return acquisitionOnboardingPath(params) || "/dashboard";
};

const postRegisterLoginTarget = (destination) => destination && destination !== "/dashboard" ? `/login?redirect=${encodeURIComponent(destination)}` : "/login";
const extractToken = (payload = {}) => payload.token?.access_token ?? payload.token?.original?.access_token ?? payload.access_token ?? (typeof payload.token === "string" ? payload.token : null);

class RegisterPage extends Component {
  constructor(props) { super(props); this.state = { first_name: "", email: "", password: "", confirmPassword: "", loading: false }; }
  onChangeFirstName = (e) => this.setState({ first_name: e.target.value });
  onChangeEmail = (e) => this.setState({ email: e.target.value });
  onChangePassword = (e) => this.setState({ password: e.target.value });
  onChangeConfirmPassword = (e) => this.setState({ confirmPassword: e.target.value });

  onSubmit = async (e) => {
    e.preventDefault();
    const { first_name, email, password, confirmPassword } = this.state;
    if (password !== confirmPassword) { Swal.fire({ title: "Erro!", text: "As senhas não coincidem. Por favor, tente novamente.", icon: "error", confirmButtonText: "Ok", iconColor: "#dc3545", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } }); return; }
    this.setState({ loading: true });
    try {
      const acquisition = captureAcquisitionAttribution();
      const response = await axios.post(`${apiBaseUrl}/auth/register`, { first_name, email, password });
      const destination = postRegisterDestination();
      trackTelemetryEvent("plat_signup_completed", { target: "registration", label: acquisition.source || "direct", metadata: { ...acquisitionTelemetryMetadata(acquisition), next_step: destination.startsWith("/establishment/create") ? "establishment_create" : destination.startsWith("/planos") ? "plans" : "dashboard" } });
      try {
        const { data } = await api.post("/auth/login", { username: email, password, latitude: null, longitude: null });
        const token = extractToken(data);
        if (!token) throw new Error("Token de autenticação não recebido pela API.");
        localStorage.setItem("token", token);
        window.dispatchEvent(new Event("authChanged"));
        window.location.replace(destination);
        return;
      } catch {
        localStorage.removeItem("token");
        const modalMessage = response?.data?.message || "Sua conta foi criada com sucesso.";
        await Swal.fire({ title: "Conta criada!", text: `${modalMessage} Entre para continuar a configuração da Plat.`, icon: "success", confirmButtonText: "Continuar", iconColor: "#28a745", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } });
        window.location.replace(postRegisterLoginTarget(destination));
      }
    } catch (error) {
      let errorMessages = "";
      if (error.response?.data?.errors) { const errors = error.response.data.errors; if (errors.email) errorMessages += `${errors.email[0]} `; if (errors.first_name) errorMessages += `${errors.first_name[0]} `; if (errors.password) errorMessages += `${errors.password[0]} `; }
      else errorMessages = error.response?.data?.message || "Erro desconhecido ao tentar se registrar.";
      Swal.fire({ title: "Erro!", text: errorMessages, icon: "error", confirmButtonText: "Ok", iconColor: "#dc3545", customClass: { popup: "custom-swal", title: "custom-swal-title", content: "custom-swal-text" } });
    } finally { this.setState({ loading: false }); }
  };

  render() {
    const { loading, first_name, email, password, confirmPassword } = this.state;
    return <>{loading && <ProcessingIndicatorComponent messages={["Criando sua conta...", "Preparando seu acesso à Plat..."]} />}{!loading && <AuthShell eyebrow="Nova conta" title="Comece na Plat" description="Crie sua conta para organizar seus estabelecimentos e centralizar sua operação em um só lugar." footer={<><p>Já possui uma conta? <a href="/login">Entrar</a></p><p>Esqueceu sua senha? <a href="/password-email">Recuperar senha</a></p></>}><Form onSubmit={this.onSubmit} className="form-container"><Form.Group className="form-group"><Form.Control type="text" placeholder="Seu nome" onChange={this.onChangeFirstName} value={first_name} required /></Form.Group><Form.Group className="form-group"><Form.Control type="email" placeholder="Seu e-mail" onChange={this.onChangeEmail} value={email} required /></Form.Group><Form.Group className="form-group"><Form.Control type="password" placeholder="Crie uma senha" onChange={this.onChangePassword} value={password} required /></Form.Group><Form.Group className="form-group"><Form.Control type="password" placeholder="Confirme sua senha" onChange={this.onChangeConfirmPassword} value={confirmPassword} required /></Form.Group><Button type="submit" disabled={loading} className="submit-btn">Criar minha conta</Button></Form></AuthShell>}</>;
  }
}

export default RegisterPage;

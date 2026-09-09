import React, { useState } from "react";
import { Form, Button, Spinner, Alert, Card } from "react-bootstrap";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { apiBaseUrl } from "../../config";

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

export default function InviteCompletePage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    verification_code: searchParams.get("code") || "",
    password: "",
    password_confirmation: "",
  });
  const [status, setStatus] = useState({ loading: false, error: "" });

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "verification_code" ? value.toUpperCase() : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!isStrongPassword(form.password)) {
      setStatus({
        loading: false,
        error: "A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, minúscula, número e símbolo.",
      });
      return;
    }

    if (form.password !== form.password_confirmation) {
      setStatus({ loading: false, error: "As senhas não coincidem." });
      return;
    }

    setStatus({ loading: true, error: "" });
    try {
      await axios.post(`${apiBaseUrl}/invite-complete`, {
        email: form.email.trim().toLowerCase(),
        verification_code: form.verification_code.trim().toUpperCase(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      window.location.replace("/login?invitation=completed");
    } catch (error) {
      setStatus({
        loading: false,
        error:
          error.response?.data?.message ||
          Object.values(error.response?.data?.errors || {}).flat()[0] ||
          "Não foi possível ativar sua conta.",
      });
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 560 }}>
      <Card>
        <Card.Body className="p-4 p-md-5">
          <h1 className="h3 mb-2">Ative sua conta na Plat</h1>
          <p className="text-muted mb-4">
            Digite o código recebido por e-mail e crie sua senha. Ao concluir, seu e-mail será confirmado e o acesso à Plat será liberado.
          </p>

          {status.error && <Alert variant="danger">{status.error}</Alert>}

          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control
                required
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                autoComplete="email"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Código de confirmação</Form.Label>
              <Form.Control
                required
                name="verification_code"
                value={form.verification_code}
                onChange={change}
                autoComplete="one-time-code"
                maxLength={12}
                inputMode="text"
                style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}
              />
              <Form.Text className="text-muted">Use o código enviado no e-mail de convite.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nova senha</Form.Label>
              <Form.Control
                required
                minLength={8}
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                autoComplete="new-password"
              />
              <Form.Text className="text-muted">
                Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirme a senha</Form.Label>
              <Form.Control
                required
                minLength={8}
                type="password"
                name="password_confirmation"
                value={form.password_confirmation}
                onChange={change}
                autoComplete="new-password"
              />
            </Form.Group>

            <Button className="w-100" type="submit" disabled={status.loading}>
              {status.loading ? <Spinner size="sm" animation="border" /> : "Confirmar e criar senha"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </main>
  );
}

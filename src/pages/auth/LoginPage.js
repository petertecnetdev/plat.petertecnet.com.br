// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import Swal from "sweetalert2";
import api from "../../services/api"; // sua instância axios configurada com baseURL
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Auth.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const setToken = (token) => {
    localStorage.setItem("token", token);
  };

  const extractToken = (payload) => (
    payload.token?.access_token
    ?? payload.token?.original?.access_token
    ?? payload.access_token
    ?? payload.token
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      const token = extractToken(data);
      if (!token) throw new Error("Não recebi token do servidor");

      setToken(token);
      // hard‑reload para remontar o <App /> e disparar o useEffect de /auth/me
      window.location.href = "/dashboard";
    } catch (err) {
      let msg = "Ocorreu um erro. Tente novamente.";
      if (err.response) {
        msg = err.response.data.error
           || err.response.data.message
           || msg;
      }
      Swal.fire({
        title: "Erro!",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok"
      });
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (resp) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", {
        token_id: resp.credential
      });
      const token = extractToken(data);
      if (!token) throw new Error("Token do Google não recebido");

      setToken(token);
      window.location.href = "/dashboard";
    } catch (err) {
      let msg = "Falha no login com Google";
      if (err.response) {
        msg = err.response.data.error
           || err.response.data.message
           || msg;
      }
      Swal.fire({
        title: "Erro!",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok"
      });
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    Swal.fire({
      title: "Erro!",
      text: "Falha no login com Google",
      icon: "error",
      confirmButtonText: "Ok"
    });
  };

  return (
    <Container fluid className="page-container">
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Autenticando...", "Por favor aguarde..."]}
        />
      )}

      {!loading && (
        <Row className="page-row">
          <Col md={{ span: 6, offset: 3 }} lg={{ span: 4, offset: 4 }}>
            <Card className="card-container">
              <Card.Body className="card-body text-center">
                <h2 className="mb-4 text-uppercase">Plat</h2>
                <div className="logo-container mb-4">
                  <img src="/images/logo.png" alt="Logo" className="logo-image" />
                </div>

                <Form onSubmit={handleSubmit} className="form-container">
                  <Form.Group controlId="loginUsername" className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="E-mail ou usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="loginPassword" className="mb-4">
                    <Form.Control
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button variant="warning" type="submit" className="w-100 mb-3">
                    Entrar
                  </Button>
                </Form>

                <div className="google-login-container mb-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                  />
                </div>

                <div className="mt-2">
                  <a href="/register" className="me-3">Registrar-se</a>
                  <a href="/password-email">Recuperar senha</a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

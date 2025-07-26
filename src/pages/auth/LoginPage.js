// src/pages/auth/LoginPage.jsx
import React, { Component } from "react";
import axios from "axios";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import "./Auth.css";

export default class LoginPage extends Component {
  state = { username: "", password: "", loading: false };

  setToken = (token) => localStorage.setItem("token", token);

  handleUsernameChange = ({ target: { value } }) => this.setState({ username: value });
  handlePasswordChange = ({ target: { value } }) => this.setState({ password: value });

  handleGoogleSuccess = async ({ credential }) => {
    this.setState({ loading: true });
    try {
      const res = await axios.post(`${apiBaseUrl}/auth/google`, { token_id: credential });
      const token = res.data.access_token;
      if (token) {
        this.setToken(token);
        window.location.href = "/dashboard";
      }
    } catch (error) {
      Swal.fire({
        title: "Erro!",
        text: error.response?.data?.error || "Falha no login com Google",
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleGoogleError = () => {
    Swal.fire({
      title: "Erro!",
      text: "Falha no login com Google",
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
        username: this.state.username,
        password: this.state.password,
      });
      const token = data.access_token;
      if (token) {
        this.setToken(token);
        window.location.href = "/dashboard";
      }
    } catch (error) {
      let msg = "Ocorreu um erro. Tente novamente.";
      if (error.response) {
        msg = error.response.data.error || error.response.data.message || msg;
      }
      Swal.fire({
        title: "Erro!",
        text: msg,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { loading, username, password } = this.state;
    return (
      <Container fluid className="page-container">
        {loading && (
          <ProcessingIndicatorComponent
            messages={["Autenticando...", "Por favor, aguarde..."]}
          />
        )}
        {!loading && (
          <Row className="page-row">
            <Col md={12} className="page-col">
              <Card className="card-container">
                <p className="page-header text-uppercase">Plat</p>
                <Card.Body className="card-body">
                  <div className="logo-container">
                    <img src="/images/logo.png" alt="Logo" className="logo-image" />
                  </div>
                  <Form onSubmit={this.handleSubmit} className="form-container">
                    <Form.Control
                      type="text"
                      placeholder="E-mail ou usuário"
                      value={username}
                      onChange={this.handleUsernameChange}
                      className="input-username"
                      required
                    />
                    <Form.Control
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={this.handlePasswordChange}
                      className="input-password"
                      required
                    />
                    <Button type="submit" disabled={loading} className="submit-btn">
                      Entrar
                    </Button>
                  </Form>
                  <div className="google-login-container m-4">
                    <GoogleLogin
                      onSuccess={this.handleGoogleSuccess}
                      onError={this.handleGoogleError}
                      render={(props) => (
                        <Button
                          onClick={props.onClick}
                          disabled={props.disabled}
                          className="btn-google "
                        >
                          <FcGoogle size={24} /> Iniciar com Google
                        </Button>
                      )}
                    />
                  </div>
                  <p className="footer-text">
                    Não tem conta?{" "}
                    <a href="/register" className="footer-link">
                      Registrar-se
                    </a>
                  </p>
                  <p className="footer-text">
                    Esqueceu a senha?{" "}
                    <a href="/password-email" className="footer-link">
                      Recuperar senha
                    </a>
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    );
  }
}

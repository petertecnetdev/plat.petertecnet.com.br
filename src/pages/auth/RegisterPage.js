import React, { Component } from "react";
import axios from "axios";
import { Button, Card, Col, Container, Row, Form } from "react-bootstrap";
import Swal from "sweetalert2"; // Importando SweetAlert
import { apiBaseUrl } from "../../config"; // Importando a configuração da URL base da API
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent"; // Importando o componente de indicador de processamento

class RegisterPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      first_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      loading: false,
    };
  }

  onChangeFirstName = (e) => {
    this.setState({ first_name: e.target.value });
  };

  onChangeEmail = (e) => {
    this.setState({ email: e.target.value });
  };

  onChangePassword = (e) => {
    this.setState({ password: e.target.value });
  };

  onChangeConfirmPassword = (e) => {
    this.setState({ confirmPassword: e.target.value });
  };

  onSubmit = async (e) => {
    e.preventDefault();
    const { first_name, email, password, confirmPassword } = this.state;

    // Verificando se a senha e a confirmação de senha coincidem
    if (password !== confirmPassword) {
      Swal.fire({
        title: "Erro!",
        text: "As senhas não coincidem. Por favor, tente novamente.",
        icon: "error",
        confirmButtonText: "Ok",
        iconColor: "#dc3545",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return;
    }

    this.setState({ loading: true });

    try {
      const userObject = {
        first_name,
        email,
        password,
      };

      // Requisição para registrar o usuário
      const response = await axios.post(`${apiBaseUrl}/auth/register`, userObject);

      const modalMessage = response?.data?.message || "Registro bem-sucedido";

      Swal.fire({
        title: "Sucesso!",
        text: modalMessage,
        icon: "success",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
        iconColor: "#28a745",
      }).then(() => {
        window.location.href = "/login";
      });

      this.setState({ loading: false });
    } catch (error) {
      console.log(error);
      let errorMessages = "";

      if (error.response && error.response.data.errors) {
        const errors = error.response.data.errors;
        if (errors.email) {
          errorMessages += errors.email[0] + " ";
        }
        if (errors.first_name) {
          errorMessages += errors.first_name[0] + " ";
        }
        if (errors.password) {
          errorMessages += errors.password[0] + " ";
        }
      } else {
        errorMessages = "Erro desconhecido ao tentar se registrar.";
      }

      Swal.fire({
        title: "Erro!",
        text: errorMessages,
        icon: "error",
        confirmButtonText: "Ok",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
        iconColor: "#dc3545",
      });

      this.setState({ loading: false });
    }
  };

  render() {
    const { loading } = this.state;

    return (
      <Container fluid className="page-container">
        {loading && (
          <ProcessingIndicatorComponent messages={["Registrando usuário...", "Por favor, aguarde..."]} />
        )}
        {!loading && (
          <Row className="page-row">
            <Col md={12} className="page-col">
              <Card className="card-container">
                <p className="page-header text-uppercase">Registre-se</p>
                <Card.Body className="card-body">
                  <div className="logo-container">
                    <img
                      src="/images/logo.png"
                      alt="Logo"
                      className="logo-image"
                      style={{ width: "80px", height: "80px" }}
                    />
                  </div>
                  <Form onSubmit={this.onSubmit} className="form-container">
                    <Form.Group className="form-group">
                      <Form.Control
                        type="text"
                        placeholder="Nome"
                        onChange={this.onChangeFirstName}
                        value={this.state.first_name}
                        className="input-text"
                      />
                    </Form.Group>
                    <Form.Group className="form-group">
                      <Form.Control
                        type="email"
                        placeholder="Insira o Email"
                        onChange={this.onChangeEmail}
                        value={this.state.email}
                        className="input-email"
                      />
                    </Form.Group>
                    <Form.Group className="form-group">
                      <Form.Control
                        type="password"
                        placeholder="Insira a Senha"
                        onChange={this.onChangePassword}
                        value={this.state.password}
                        className="input-password"
                      />
                    </Form.Group>
                    <Form.Group className="form-group">
                      <Form.Control
                        type="password"
                        placeholder="Confirme a Senha"
                        onChange={this.onChangeConfirmPassword}
                        value={this.state.confirmPassword}
                        className="input-password-confirm"
                      />
                    </Form.Group>
                    <Button type="submit" disabled={loading} className="submit-btn">
                      {loading ? "Registrando..." : "Registrar"}
                    </Button>
                    <p className="footer-text">
                      Já está registrado? <a href="/login" className="footer-link">Entrar</a>
                    </p>
                    <p className="footer-text">
                      Esqueceu a senha? <a href="/password-email" className="footer-link">Recuperar senha</a>
                    </p>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    );
  }
}

export default RegisterPage;

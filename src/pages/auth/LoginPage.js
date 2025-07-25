import React, { Component } from 'react';
import axios from 'axios';
import { Button, Card, Col, Container, Row, Form } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { apiBaseUrl } from '../../config';
import ProcessingIndicatorComponent from '../../components/ProcessingIndicatorComponent';
import './Auth.css';

class LoginPage extends Component {
  state = {
    username: '',
    password: '',
    loading: false,
  };

  setToken = (token) => {
    localStorage.setItem('token', token);
  };

  handleUsernameChange = ({ target: { value } }) => {
    this.setState({ username: value });
  };

  handlePasswordChange = ({ target: { value } }) => {
    this.setState({ password: value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { username, password } = this.state;

    this.setState({ loading: true });

    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/auth/login`,
        { username, password }
      );
      const { access_token: token } = data;

      if (token) {
        this.setToken(token);
        window.location.href = '/dashboard';
      } else {
        throw new Error('Token não retornado');
      }
    } catch (error) {
      console.error(error.response || error);

      let errorMessage = 'Ocorreu um erro. Por favor, tente novamente.';

      if (error.response) {
        const { data } = error.response;
        if (data.errors) {
          errorMessage = Object.values(data.errors).flat().join(' ');
        } else if (data.error || data.message) {
          errorMessage = data.error || data.message;
        }
      }

      Swal.fire({
        title: 'Erro!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
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
            messages={[
              'Autenticando...',
              'Por favor, aguarde...',
            ]}
          />
        )}

        {!loading && (
          <Row className="page-row">
            <Col md={12} className="page-col">
              <Card className="card-container">
                <p className="page-header text-uppercase">Plat</p>
                <Card.Body className="card-body">
                  <div className="logo-container">
                    <img
                      src="/images/logo.png"
                      alt="Logo"
                      className="logo-image"
                    />
                  </div>
                  <Form
                    onSubmit={this.handleSubmit}
                    className="form-container"
                  >
                    <Form.Group className="form-group">
                      <Form.Control
                        type="text"
                        placeholder="Insira o username"
                        value={username}
                        onChange={this.handleUsernameChange}
                        className="input-username"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="form-group">
                      <Form.Control
                        type="password"
                        placeholder="Insira a senha"
                        value={password}
                        onChange={this.handlePasswordChange}
                        className="input-password"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="submit-btn"
                    >
                      {loading ? 'Entrando...' : 'Entrar'}
                    </Button>

                    <p className="footer-text">
                      Não tem conta?{' '}
                      <a
                        href="/register"
                        className="footer-link"
                      >
                        Registrar-se
                      </a>
                    </p>

                    <p className="footer-text">
                      Esqueceu a senha?{' '}
                      <a
                        href="/password-email"
                        className="footer-link"
                      >
                        Recuperar senha
                      </a>
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

export default LoginPage;

import React, { useState } from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import './css/Auth.css';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [resetPasswordCode, setResetPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Erro!',
        text: 'As senhas não coincidem. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
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
        title: 'Sucesso!',
        text: response.data.message || 'Senha alterada com sucesso!',
        icon: 'success',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/login';
        }
      });
    } catch (error) {
      Swal.fire({
        title: 'Erro!',
        text: error.response?.data?.message || 'Ocorreu um erro inesperado.',
        icon: 'error',
        confirmButtonText: 'Tente Novamente',
        customClass: {
          popup: 'custom-swal',
          title: 'custom-swal-title',
          content: 'custom-swal-text',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="page-container">
      {loading && (
        <ProcessingIndicatorComponent
          messages={['Redefinindo senha...', 'Por favor, aguarde...']}
        />
      )}
      {!loading && (
        <Row className="page-row">
          <Col md={12} className="page-col">
            <Card className="card-container">
              <p className="page-header text-uppercase">Redefinir Senha</p>
              <Card.Body className="card-body">
                <div className="logo-container">
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="logo-image"
                  />
                </div>
                <Form onSubmit={handleSubmit} className="form-container">
                  <Form.Group className="form-group">
                    <Form.Control
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-email"
                    />
                  </Form.Group>
                  <Form.Group className="form-group">
                    <Form.Control
                      type="text"
                      placeholder="Código de redefinição"
                      value={resetPasswordCode}
                      onChange={(e) => setResetPasswordCode(e.target.value)}
                      required
                      className="input-reset-code"
                    />
                  </Form.Group>
                  <Form.Group className="form-group">
                    <Form.Control
                      type="password"
                      placeholder="Nova Senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="input-password"
                    />
                  </Form.Group>
                  <Form.Group className="form-group">
                    <Form.Control
                      type="password"
                      placeholder="Confirmar Nova Senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input-password"
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    Alterar Senha
                  </Button>
                  <p className="footer-text">
                    Não recebeu o código?{' '}
                    <a href="/password-email" className="footer-link">
                      Solicitar novo código
                    </a>
                  </p>
                  <p className="footer-text">
                    Voltar para{' '}
                    <a href="/login" className="footer-link">
                      Login
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
};

export default PasswordResetPage;

import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import LoginFormComponent from "../../components/auth/LoginFormComponent";
import "./Auth.css";

export default function LoginPage() {
  return (
    <div className="login-bg">
      <div className="login-bg__glow login-bg__glow--one" />
      <div className="login-bg__glow login-bg__glow--two" />
      <Container fluid className="login-container">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col xs={12} sm={10} md={7} lg={5} xl={4}>
            <Card className="login-card">
              <Card.Body>
                <div className="login-brand">
                  <img src="/images/logo.png" alt="Plat" className="logo" />
                  <span>PLAT</span>
                </div>
                <div className="login-heading">
                  <span>Gestão inteligente</span>
                  <h1>Bem-vindo de volta</h1>
                  <p>Acesse sua operação, acompanhe resultados e gerencie seus estabelecimentos.</p>
                </div>
                <LoginFormComponent redirectTo="/dashboard" />
                <div className="login-security">Ambiente seguro • Peter Tecnet</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

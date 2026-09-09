import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import userService from "../../../services/UserService";
import NavlogComponent from "../../../components/NavlogComponent";
import { Link } from "react-router-dom";

const UserCreatePage = () => {
  const [userData, setUserData] = useState({
    first_name: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevUserData) => ({
      ...prevUserData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await userService.invite(userData);
      setSuccessMessage(
        response?.message ||
          "Usuário criado e convite enviado. O usuário receberá um código para confirmar o e-mail e criar a própria senha."
      );
      setUserData({ first_name: "", email: "" });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (error || successMessage) {
      timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [error, successMessage]);

  return (
    <>
      <NavlogComponent />
      <Container className="py-4">
        <Row className="justify-content-md-center">
          <Col md={7} lg={6}>
            <Card className="p-4 p-md-5">
              <Card.Body className="p-0">
                <h2 className="mb-2">Convidar usuário</h2>
                <p className="text-muted mb-4">
                  Informe apenas o nome e o e-mail. A conta será criada na Plat e o usuário definirá a própria senha após confirmar o e-mail.
                </p>

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="formFirstName">
                    <Form.Label>Nome</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      placeholder="Nome do usuário"
                      value={userData.first_name}
                      onChange={handleChange}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formEmail">
                    <Form.Label>E-mail</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="usuario@exemplo.com"
                      value={userData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={255}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="w-100 btn-lg"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Criando e enviando convite...
                      </>
                    ) : (
                      "Criar usuário e enviar convite"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <Card className="p-4 mt-4">
              <h3 className="h5">Como funciona</h3>
              <p className="mb-0 text-muted">
                O cadastro é efetivado imediatamente como pendente. O usuário recebe um e-mail de boas-vindas com um código de confirmação e um botão para concluir a ativação. Na ativação, ele confirma o e-mail e cria uma senha forte. O código expira em 24 horas e deixa de funcionar depois de utilizado.
              </p>
            </Card>

            <div className="d-flex justify-content-end mt-3">
              <Link to="/user/list">
                <Button variant="outline-secondary" disabled={loading}>
                  Voltar para usuários
                </Button>
              </Link>
            </div>
          </Col>
        </Row>
      </Container>

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          style={{ position: "fixed", top: "150px", right: "10px", zIndex: "1050", maxWidth: 420 }}
        >
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          variant="success"
          onClose={() => setSuccessMessage(null)}
          dismissible
          style={{ position: "fixed", top: "150px", right: "10px", zIndex: "1050", maxWidth: 480 }}
        >
          {successMessage}
        </Alert>
      )}
    </>
  );
};

export default UserCreatePage;

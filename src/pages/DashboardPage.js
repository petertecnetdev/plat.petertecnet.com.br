import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";

export default function Dashboard() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setEstablishments(data.establishments || []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar seus estabelecimentos.",
        });
        setEstablishments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEstablishments();
  }, []);

  const handleLogoError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="my-4 justify-content-center">
          <Col xs={12} lg={10}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="section-title">Meus Estabelecimentos</h2>
              <Button
                as={Link}
                to="/establishment/create"
                variant="primary"
                size="sm"
                className="action-button"
              >
                Cadastrar
              </Button>
            </div>
            {isLoading ? (
              <ProcessingIndicatorComponent
                messages={[
                  "Carregando seus estabelecimentos...",
                  "Por favor, aguarde...",
                ]}
              />
            ) : establishments.length > 0 ? (
              <Row className="g-4">
                {establishments.map((est) => (
                  <Col key={est.id} xs={12} sm={6} md={4} lg={3}>
                    <Card className="card-component shadow-sm h-100">
                      <div
                        className="card-bg"
                        style={{
                          backgroundImage: `url('${storageUrl}/${est.logo || "images/logo.png"}')`,
                        }}
                      />
                      <Card.Body className="inner-card-body d-flex flex-column justify-content-between">
                        <Link
                          to={`/establishment/view/${est.slug}`}
                          className="link-component text-decoration-none"
                        >
                          <div className="d-flex align-items-center mb-3">
                            <img
                              src={`${storageUrl}/${est.logo || "images/logo.png"}`}
                              alt={est.name}
                              className="img-component"
                              onError={handleLogoError}
                            />
                            <span className="label-name-bg ms-3">{est.name}</span>
                          </div>
                        </Link>
                        <div className="d-flex justify-content-around flex-wrap">
                          <Button
                            as={Link}
                            to={`/order/create/${est.id}`}
                            variant="success"
                            size="sm"
                            className="dashboard-button mb-2"
                          >
                            Novo Pedido
                          </Button>
                          <Button
                            as={Link}
                            to={`/order/list/${est.id}`}
                            variant="info"
                            size="sm"
                            className="dashboard-button mb-2"
                          >
                            Ver Pedidos
                          </Button>
                          <Button
                            as={Link}
                            to={`/item/list/${est.slug}`}
                            variant="warning"
                            size="sm"
                            className="dashboard-button mb-2"
                          >
                            Itens
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <p className="text-center">Nenhum estabelecimento encontrado.</p>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}

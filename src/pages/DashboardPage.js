import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";

const Dashboard = () => {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        });
        setEstablishments(data.establishments || []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar seus estabelecimentos."
        });
        setEstablishments([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogoError = e => { e.target.src = "/images/logo.png"; };

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="m-2">
            <Card className="card-component shadow-sm">
              <p className="section-title text-center">Meus Estabelecimentos</p>
              <Card.Body className="card-body">
                {isLoading ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent
                      messages={[
                        "Carregando seus estabelecimentos...",
                        "Por favor, aguarde..."
                      ]}
                    />
                  </Col>
                ) : (
                  establishments.length > 0 ? (
                    <Row className="inner-row">
                      {establishments.map(est => (
                        <Col key={est.id} xs={12} md={6} lg={4} className="inner-col mb-4">
                          <Card className="inner-card h-100">
                            <div
                              className="card-bg"
                              style={{ backgroundImage: `url('${storageUrl}/${est.logo || "images/logo.png"}')` }}
                            />
                            <Card.Body className="inner-card-body card-content d-flex flex-column justify-content-center">
                              <Link to={`/establishment/view/${est.slug}`} className="link-component">
                                <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center text-center text-sm-start">
                                  <img
                                    src={`${storageUrl}/${est.logo || "images/logo.png"}`}
                                    className="img-component"
                                    alt={est.name}
                                    onError={handleLogoError}
                                  />
                                  <p className="label-name-bg m-2">{est.name}</p>
                                </div>
                              </Link>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Col xs={12} className="empty-section text-center">
                      <p className="empty-text">Você não possui estabelecimentos cadastrados.</p>
                      <Link to="/establishment/create" className="link-component">
                        <Button variant="primary" className="action-button">Cadastrar Novo Estabelecimento</Button>
                      </Link>
                    </Col>
                  )
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Dashboard;

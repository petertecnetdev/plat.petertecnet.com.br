import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import NavlogComponent from "../components/NavlogComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../config";
import "./Dashboard.css";

export default function Dashboard() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEstablishments(data.establishments || []);
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Não foi possível carregar seus estabelecimentos.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogoError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/logo.png";
  };

  return (
    <div className="dashboard-root">
      <NavlogComponent />
      <Container fluid className="dashboard-main">
        <div className="dashboard-topbar">
          <div className="dashboard-title-wrap">
            <h2 className="dashboard-title">Dashboard Geral</h2>
            <span className="dashboard-subtitle">Gestão central dos seus negócios</span>
          </div>
          <Button as={Link} to="/establishment/create" className="dashboard-btn-primary">
            + Novo Estabelecimento
          </Button>
        </div>

        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Meus Estabelecimentos</h3>
          <Row className="dashboard-establishments-list">
            {isLoading ? (
              <Col>
                <div className="dashboard-loading">
                  <Spinner animation="border" variant="warning" />
                  <span>Carregando estabelecimentos...</span>
                </div>
              </Col>
            ) : establishments.length === 0 ? (
              <Col>
                <div className="dashboard-empty">
                  Nenhum estabelecimento encontrado.
                </div>
              </Col>
            ) : (
              establishments.map((est) => (
                <Col key={est.id} md={12}>
                  <Card className="dashboard-establishment-card">
                    <Card.Body>
                      <div className="dashboard-establishment-header">
                        <img
                          src={`${storageUrl}/${est.logo || "logo.png"}`}
                          alt={est.name}
                          className="dashboard-establishment-logo"
                          onError={handleLogoError}
                        />
                        <div>
                          <div className="dashboard-establishment-name">{est.name}</div>
                          <div className="dashboard-establishment-slug">@{est.slug}</div>
                        </div>
                      </div>
                      <div className="dashboard-establishment-status">
                        <span
                          className={
                            est.active
                              ? "dashboard-status-active"
                              : "dashboard-status-inactive"
                          }
                        >
                          {est.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <div className="dashboard-establishment-actions">
                        <Button as={Link} to={`/order/create/${est.id}`} size="sm" className="dashboard-establishment-btn">
                          🛒 Pedido
                        </Button>
                        <Button as={Link} to={`/order/list/${est.id}`} size="sm" className="dashboard-establishment-btn">
                          📑 Pedidos
                        </Button>
                        <Button as={Link} to={`/report/order/${est.id}`} size="sm" className="dashboard-establishment-btn">
                          📊 Relatório
                        </Button>
                        <Button as={Link} to={`/item/list/${est.slug}`} size="sm" className="dashboard-establishment-btn">
                          🍔 Itens
                        </Button>
                        <Button as={Link} to={`/establishment/update/${est.id}`} size="sm" className="dashboard-establishment-btn">
                          ✏️ Editar
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </div>
      </Container>
    </div>
  );
}

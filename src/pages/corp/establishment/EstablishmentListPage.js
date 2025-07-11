import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../../config";
import { Link } from "react-router-dom";

const BarbershopListPage = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  const fetchBarbershops = async () => {
    setMessages(["Carregando barbearias..."]);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.get(`${apiBaseUrl}/barbershop/user`, { headers });
      if (response?.data?.barbershops) {
        setBarbershops(response.data.barbershops.data);
      } else {
        setBarbershops([]);
      }
    } catch (error) {
      console.error("Erro ao carregar barbearias:", error.response?.data);
      Swal.fire({
        title: "Erro",
        text:
          error.response?.data?.error ||
          "Não foi possível carregar as barbearias. Tente novamente mais tarde.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      setBarbershops([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershops();
  }, []);

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esta ação não pode ser desfeita!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, deletar!",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        await axios.delete(`${apiBaseUrl}/barbershop/${id}`, { headers });

        Swal.fire({
          title: "Deletado!",
          text: "A barbearia foi deletada com sucesso.",
          icon: "success",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        setBarbershops(barbershops.filter((barbershop) => barbershop.id !== id));
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao deletar barbearia.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };

  const handleBarbershopLogoError = (e) => {
    e.target.src = "images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Minhas Barbearias</p>
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <Card.Body className="card-body">
                <div className="mb-3 text-center">
                  <Link to="/barbershop/create" className="link-component">
                    <Button variant="primary" className="action-button">
                      Cadastrar Nova Barbearia
                    </Button>
                  </Link>
                </div>
                {isLoading ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent messages={messages} />
                  </Col>
                ) : (
                  <>
                    {barbershops.length > 0 ? (
                      <Row className="inner-row">
                        {barbershops.map((barbershop) => {
                          const bgImage = `${storageUrl}/${barbershop.logo || "images/logo.png"}`;
                          return (
                            <Col key={barbershop.id}  md={12} className="inner-col m-4">
                              <Card className="inner-card h-100">
                              
                                {/* Card Content Overlay */}
                                <Card.Body className="inner-card-body d-flex flex-column justify-content-between">
                                  <div className="text-center">
                                    <Link to={`/barbershop/view/${barbershop.slug}`} className="link-component">
                                      <img
                                        src={bgImage}
                                        className="img-component mb-3"
                                        alt={barbershop.name}
                                        onError={handleBarbershopLogoError}
                                      />
                                      <p className="item-title">{barbershop.name}</p>
                                    </Link>
                                  </div>
                                  <div className="d-flex flex-wrap justify-content-center">
                                    <Link to={`/service-record/barbershop/${barbershop.slug}`} className="link-component m-1">
                                      <Button variant="secondary" className="action-button">
                                        Atendimentos
                                      </Button>
                                    </Link>
                                    <Link to={`/barber/include/${barbershop.slug}`} className="link-component m-1">
                                      <Button variant="secondary" className="action-button">
                                        Barbeiros
                                      </Button>
                                    </Link>
                                    <Link to={`/item/list/${barbershop.slug}`} className="link-component m-1">
                                      <Button variant="secondary" className="action-button">
                                        Itens
                                      </Button>
                                    </Link>
                                    <Link to={`/appointment/barbershop/${barbershop.slug}`} className="link-component m-1">
                                      <Button variant="secondary" className="action-button">
                                        Agendamentos
                                      </Button>
                                    </Link>
                                    <Link to={`/barbershop/update/${barbershop.id}`} className="link-component m-1" style={{ textDecoration: "none" }}>
                                      <Button variant="secondary" className="action-button">
                                        Editar
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="danger"
                                      className="action-button m-1"
                                      onClick={() => handleDelete(barbershop.id)}
                                    >
                                      Deletar
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <Col xs={12} className="empty-section text-center">
                        <p className="empty-text">Nenhuma barbearia encontrada.</p>
                      </Col>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarbershopListPage;

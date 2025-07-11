// BarberViewPage.jsx
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarberViewPage = () => {
  const { username } = useParams();
  const [barber, setBarber] = useState(null);
  const [user, setUser] = useState(null);
  const [barbershops, setBarbershops] = useState([]);

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!username) {
        Swal.fire({
          title: "Erro",
          text: "O username não foi encontrado na URL.",
          icon: "error",
        });
        return;
      }

      try {
        const response = await axios.get(`${apiBaseUrl}/barber/${username}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const { barber, user } = response.data;

        setBarber(barber || {});
        setUser(user || {});
        setBarbershops(barber?.barbershops || []);
      } catch (error) {
        console.error(error.response?.data);
        Swal.fire({
          title: "Erro",
          text: error.response?.data?.error || "Erro ao carregar os dados.",
          icon: "error",
        });
      }
    };

    fetchBarberData();
  }, [username]);

  // Fallback para o avatar do barbeiro
  const handleBarberAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

  // Fallback para o logo da barbearia
  const handleBarbershopLogoError = (e) => {
    if (e.target.src.includes("/images/logo.png")) return;
    e.target.src = "/images/logo.png";
  };

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            {barber && user ? (
              <>
                {/* Informações do barbeiro */}
                <Row className="barber-info-row">
                  <Col md={12} className="barber-info-col">
                    <Card className="card-component barber-info-card shadow-sm">
                      <Card.Body className="card-body barber-info-card-body">
                        <Row className="barber-details-row">
                          <Col md={3} className="barber-avatar-col text-center">
                            <img
                              src={
                                user.avatar
                                  ? `${storageUrl}/${user.avatar}`
                                  : "/images/user.png"
                              }
                              alt={user.first_name || "Avatar"}
                              className="img-component barber-avatar"
                              onError={handleBarberAvatarError}
                            />
                            <p className="barber-name mt-2 h4">
                              {user.first_name}
                            </p>
                            <p className="barber-name m-2 text-warning h6">
                              {user.user_name}
                            </p>
                            <p className="barber-location">
                              {user.city} - {user.uf}
                            </p>
                          </Col>

                          <Col md={3} />

                          <Col md={3} className="barber-contact-col">
                            <Button
                              variant="primary"
                              className="action-button w-100 mt-2"
                              disabled={!user.phone}
                              onClick={() => {
                                if (user.phone) {
                                  const whatsappURL = `https://wa.me/${user.phone}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20seus%20serviços%20.`;
                                  window.open(whatsappURL, "_blank");
                                }
                              }}
                            >
                              {user.phone
                                ? `WhatsApp: ${user.phone}`
                                : "WhatsApp não cadastrado"}
                            </Button>

                            <p className="barber-email">Email: {user.email}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Descrição do barbeiro, se houver */}
                  {barber.description && (
                    <Col md={6} className="barber-description-col mt-4">
                      <Card className="card-component barber-description-card shadow-sm">
                        <Card.Body className="card-body barber-description-card-body">
                          <p className="barber-description-text">
                            {barber.description}
                          </p>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>

                {/* Lista de barbearias associadas ao barbeiro */}
                <Row className="barbershops-row mt-4">
                  <Col md={12} className="barbershops-col">
                    <Card className="card-component barbershops-card shadow-sm">
                      <Card.Body className="card-body barbershops-card-body">
                        <p className="barbershops-title">
                          Barbearias que {user.first_name || "N/D"} está
                          associado
                        </p>
                        <Row className="barbershops-list-row">
                          {barbershops.map((barbershop) => (
                            <Col
                              md={12}
                              key={barbershop.id}
                              className="barbershop-card-col m-2"
                            >
                              {/* Usando o card conforme solicitado */}
                              <Card className="inner-card ">
                                <div
                                  className="card-bg"
                                  style={{
                                    backgroundImage: `url('${storageUrl}/${
                                      barbershop.logo || "images/logo.png"
                                    }')`,
                                  }}
                                />
                                <Card.Body className="inner-card-body card-content d-flex flex-column justify-content-center">
                                  <Link
                                    to={`/barbershop/view/${barbershop.slug}`}
                                    className="link-component"
                                  >
                                    {/* Disposição responsiva do logo e nome */}
                                    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center text-center text-sm-start">
                                      <img
                                        src={
                                          barbershop.logo
                                            ? `${storageUrl}/${barbershop.logo}`
                                            : "/images/logo.png"
                                        }
                                        className="img-component"
                                        alt={barbershop.name}
                                        onError={handleBarbershopLogoError}
                                      />
                                      <p className="item-title mt-2 mt-sm-0 ms-sm-2">
                                        {barbershop.name}
                                      </p>
                                    </div>
                                  </Link>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
            ) : (
              // Exibe indicador de processamento se dados ainda não estiverem disponíveis
              <ProcessingIndicatorComponent
                messages={[
                  "Carregando os dados do barbeiro...",
                  "Organizando as informações.",
                  "Quase finalizando! Espere só um pouco.",
                ]}
              />
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarberViewPage;

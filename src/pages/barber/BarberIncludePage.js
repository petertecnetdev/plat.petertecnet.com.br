import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { Link, useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const BarberIncludePage = () => {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carrega os dados da barbearia e os barbeiros associados
  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setBarbershop(response.data.barbershop);
        setBarbers(response.data.barbers);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBarbershop();
  }, [slug]);

  const handleBarberAvatarError = (e) => {
    e.target.src = "/images/user.png";
  };

  // Função para remover o barbeiro
  const handleRemoveBarber = async (barberId) => {
    try {
      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esse barbeiro será desvinculado da barbearia.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, desvincular",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      if (result.isConfirmed) {
        setIsProcessing(true);
        const requestBody = {
          barber_id: barberId,
          barbershop_id: barbershop.id,
        };

        try {
          await axios.delete(`${apiBaseUrl}/barber`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: requestBody,
          });

          Swal.fire({
            icon: "success",
            title: "Desvinculado!",
            text: "O barbeiro foi desvinculado com sucesso.",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });

          setBarbers((prevBarbers) =>
            prevBarbers.filter((barber) => barber.id !== barberId)
          );
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Erro ao desvincular o barbeiro.";
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: errorMessage,
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Erro ao confirmar a exclusão.",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };

  // Função para adicionar um novo barbeiro
  const handleAddBarber = async () => {
    const { value: email } = await Swal.fire({
      title: "Adicionar Barbeiro",
      text: "Digite o email do novo barbeiro para associar:",
      input: "email",
      inputPlaceholder: "Digite o email aqui...",
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });

    if (email) {
      setIsProcessing(true);
      const requestBody = {
        barbershop_id: barbershop?.id,
        email,
      };

      try {
        await axios.post(`${apiBaseUrl}/barber`, requestBody, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "O novo barbeiro foi associado com sucesso.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        // Atualiza a lista de barbeiros
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setBarbers(response.data.barbers);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Erro ao associar o barbeiro.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (isProcessing) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Processando...",
          "Atualizando lista de barbeiros...",
          "Quase pronto! Apenas um momento.",
        ]}
      />
    );
  }

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent
          messages={[
            "Carregando dados da barbearia...",
            "Verificando barbeiros associados...",
          ]}
        />
      ) : (
        <Container className="main-container" fluid>
          {barbershop && (
            <Card className="barber-include-card">
              <Card.Body className="barber-include-card-body">
                <Row className="barber-include-row">
                  <Col md={12} className="barbershop-info-col">
                    <p className="barbershop-name-text">
                      {barbershop.name}{" "}
                      <img
                        src={
                          barbershop.logo
                            ? `${storageUrl}/${barbershop.logo}`
                            : "/images/barbershoplogo.png"
                        }
                        alt={barbershop.name}
                        className="barbershop-logo"
                      />
                    </p>
                  </Col>
                  <Col md={12} className="barbers-associated-col">
                    <p className="barbers-associated-title">
                      Barbeiros Associados
                    </p>
                    {barbers.length === 0 ? (
                      <p className="no-barbers-text">
                        Nenhum barbeiro encontrado.
                      </p>
                    ) : (
                      <Row className="barbers-list-row">
                        {barbers.map((barber) => (
                          <Col
                            key={barber.id}
                            md={4}
                            className="barber-card-col"
                          >
                            <Card className="barber-card">
                              <Card.Body className="barber-card-body">
                                <img
                                  src={
                                    barber.avatar
                                      ? `${storageUrl}/${barber.avatar}`
                                      : "/images/user.png"
                                  }
                                  alt={barber.first_name}
                                  className="barber-avatar"
                                  onError={handleBarberAvatarError}
                                />
                                <p className="barber-name-title">
                                  <Link
                                    to={`/barber/view/${barber.user_name}`}                                   
                                  >
                                    {barber.first_name}
                                  </Link>
                                </p>
                                <p className="barber-email">{barber.email}</p>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveBarber(barber.id)}
                                  disabled={isProcessing}
                                  className="remove-barber-button"
                                >
                                  {isProcessing ? "Processando..." : "Remover"}
                                </Button>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                    <div className="add-barber-button-container">
                      <Button
                        variant="success"
                        onClick={handleAddBarber}
                        className="add-barber-button"
                      >
                        Associar Novo Barbeiro
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Container>
      )}
    </>
  );
};

export default BarberIncludePage;

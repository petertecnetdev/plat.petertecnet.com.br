import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import NavlogComponent from "../../../components/NavlogComponent";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { storageUrl, apiBaseUrl } from "../../../config";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";

const BarbershopBarbersPage = () => {
  const { slug } = useParams();
  const [barbers, setBarbers] = useState([]);
  const [barbershopId, setBarbershopId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para o indicador de carregamento

  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        setBarbers(response.data.barbers);
        setBarbershopId(response.data.barbershop.id);
      } catch (error) {
        console.log('erro:');
        const errorMessage =
          error.response?.data?.message || "Erro ao carregar informações da barbearia.";
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorMessage,
        });
      } finally {
        setIsLoading(false); // Finaliza o carregamento
      }
    };

    fetchBarbershop();
  }, [slug]);

  const handleAddBarber = async () => {
    const { value: barberEmail } = await Swal.fire({
      title: "Adicionar Barbeiro",
      input: "email",
      inputLabel: "Insira o email do barbeiro",
      inputPlaceholder: "email@exemplo.com",
      showCancelButton: true,
      confirmButtonText: "Adicionar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Você precisa digitar um email!";
      },
    });

    if (barberEmail) {
      try {
        await axios.post(
          `${apiBaseUrl}/barber`,
          {
            barbershop_id: barbershopId,
            email: barberEmail,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Barbeiro adicionado com sucesso!",
        });

        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBarbers(response.data.barbers);
      } catch (error) {
        console.log(error.response.data);
        let errorMessage = error.response?.data?.message || error.response.data.error || "Erro ao adicionar barbeiro.";

        if (error.response && error.response.status === 422) {
          const validationErrors = error.response.data.errors;
          errorMessage = Object.values(validationErrors)
            .map((msgArray) => msgArray.join(", "))
            .join("\n");
        }

        Swal.fire({
          title: "Erro!",
          text: errorMessage,
          icon: "error",
        });
      }
    }
  };

  const handleRemoveBarber = async (barberEmail) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Você não poderá reverter isso!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${apiBaseUrl}/barber`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: {
              barbershop_id: barbershopId,
              email: barberEmail,
            },
          });

          setBarbers(barbers.filter((barber) => barber.email !== barberEmail));

          Swal.fire({
            icon: "success",
            title: "Removido!",
            text: "O barbeiro foi removido com sucesso.",
          });
        } catch (error) {
          let errorMessage = error.response?.data?.message || "Erro ao remover barbeiro.";

          if (error.response && error.response.status === 422) {
            const validationErrors = error.response.data.errors;
            errorMessage = Object.values(validationErrors)
              .map((msgArray) => msgArray.join(", "))
              .join("\n");
          }

          Swal.fire({
            title: "Erro!",
            text: errorMessage,
            icon: "error",
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <ProcessingIndicatorComponent
        messages={[
          "Carregando barbeiros associados...",
          "Aguarde enquanto buscamos os dados.",
          "Quase lá, carregando informações.",
        ]}
      />
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container>
        <p className="labeltitle h4 text-center text-uppercase">Barbeiros associados</p>
        <Button variant="primary" onClick={handleAddBarber} className="mb-3">
          Associar novo Barbeiro 
        </Button>
        <Row className="justify-content-center mt-4">
          <Col md={12}>
            <Card>
              <Card.Body>
                {barbers.length > 0 ? (
                  <Row>
                    {barbers.map((barber) => {
                      const avatarUrl = barber.avatar
                        ? `${storageUrl}/${barber.avatar}`
                        : "/images/user.png";

                      return (
                        <Col xs={12} sm={6} md={4} key={barber.id} className="mb-3">
                          <Card className="card-barbershop-show">
                            <div
                              className="background-image"
                              style={{
                                backgroundImage: `url('${avatarUrl}')`,
                              }}
                            />
                            <Link to={`/user/${barber.user_name}`} style={{ textDecoration: "none" }}>
                              <img
                                src={avatarUrl}
                                className="rounded-circle img-logo-barbershop-show"
                                style={{ margin: "0 auto", display: "block" }}
                                alt={barber.first_name}
                              />
                            </Link>
                            <Card.Body>
                              <Link to={`/user/${barber.user_name}`} style={{ textDecoration: "none" }}>
                                <p className="labeltitle h6 text-center text-uppercase">{barber.first_name}</p>
                              </Link>
                              <div className="text-center">
                                <Button variant="danger" onClick={() => handleRemoveBarber(barber.email)}>
                                  Remover
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                ) : (
                  <ListGroup.Item>Nenhum barbeiro encontrado.</ListGroup.Item>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarbershopBarbersPage;

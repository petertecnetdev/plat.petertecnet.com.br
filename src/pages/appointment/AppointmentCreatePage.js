import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";

const AppointmentCreatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [items, setItems] = useState([]);
  const [barbershopId, setBarbershopId] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  // Dados do agendamento
  const [appointmentData, setappointmentData] = useState({
    scheduled_at: "",
    provider_id: "",
    notes: "",
    service_ids: [],
  });

  useEffect(() => {
    const fetchBarbershop = async () => {
      setMessages(["Carregando informações da barbearia e serviços..."]);
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const barbershopData = response.data.barbershop || response.data;
        setBarbershop(barbershopData);
        setBarbershopId(barbershopData.id);
        setItems(response.data.items || []);
        setBarbers(response.data.barbers || []);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Erro ao carregar informações da barbearia.";
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
        setMessages([]);
      }
    };

    if (slug) {
      fetchBarbershop();
    }
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setappointmentData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Atualiza a lista de serviços selecionados
  const handleServiceSelection = (e) => {
    const itemId = parseInt(e.target.value);
    const checked = e.target.checked;

    setappointmentData((prevData) => {
      let updatedServices = [...prevData.service_ids];
      if (checked) {
        updatedServices.push(itemId);
      } else {
        updatedServices = updatedServices.filter((id) => id !== itemId);
      }
      return { ...prevData, service_ids: updatedServices };
    });
  };

  // Validação dos campos
  const validateFields = () => {
    const errors = [];
    if (!appointmentData.scheduled_at) {
      errors.push("A data e hora do agendamento é obrigatória.");
    }
    if (!appointmentData.provider_id) {
      errors.push("Selecione um barbeiro para ser o prestador.");
    }
    if (appointmentData.service_ids.length === 0) {
      errors.push("Selecione ao menos um serviço.");
    }

    if (errors.length > 0) {
      Swal.fire({
        title: "Erro de validação",
        text: errors.join("\n"),
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateFields()) return;

    if (!barbershopId) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível obter o ID da barbearia.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    setIsProcessing(true);
    setMessages(["Aguarde enquanto realizamos seu agendamento..."]);

    // Cada serviço dura ~25 minutos
    const BASE_DURATION = 25; // minutos
    const totalDuration = appointmentData.service_ids.length * BASE_DURATION;

    // Calcula expected_end_time
    const scheduledAtDate = new Date(appointmentData.scheduled_at);
    const expectedEndTimeDate = new Date(scheduledAtDate.getTime() + totalDuration * 60000);

    // Tenta obter o client_id a partir de /auth/me
    let clientId = localStorage.getItem("client_id");
    try {
      const authResponse = await axios.get(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      clientId = authResponse.data.user.id;
    } catch (error) {
      clientId = localStorage.getItem("client_id") || 1;
    }

    const payload = {
      app_id: 1,
      entity_name: "barbershop",
      entity_id: barbershopId,
      scheduled_at: appointmentData.scheduled_at,
      service_ids: appointmentData.service_ids, // Array de serviços selecionados
      expected_end_time: expectedEndTimeDate.toISOString(),
      provider_id: appointmentData.provider_id,
      description: "",
      client_id: clientId,
      registered_by: clientId,
      status: "pending",
      location: "",
      duration: totalDuration,
      notes: appointmentData.notes,
      payment_status: "pending",
      appointment_type: "presencial",
    };

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      };

      await axios.post(`${apiBaseUrl}/appointment`, payload, { headers });

      Swal.fire({
        title: "Sucesso!",
        text: "Agendamento criado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(-1);
        }
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "Os seguintes campos têm erros:\n";
        for (const field in validationErrors) {
          errorMessage += `${field}: ${validationErrors[field].join(", ")}\n`;
        }
        Swal.fire({
          title: "Validação Falhou",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar criar o agendamento. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />

      <p className="section-title text-center">Agendar</p>
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            {isProcessing ? (
              <div className="loading-section">
                <ProcessingIndicatorComponent messages={messages} />
              </div>
            ) : (
              <Card className="card-component appointment-create-card shadow-sm">
                <Card.Body className="card-body appointment-create-card-body">
                  {barbershop && (
                    <p className="mb-3 text-center">
                      Agendamento em: <strong>{barbershop.name}</strong>
                    </p>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Selecionar serviços */}
                      <Col md={12} className="mb-4">
                        <p className="mb-2">Selecione os Serviços</p>
                        <Row>
                          {items.length === 0 ? (
                            <Col xs={12}>
                              <p>Nenhum serviço disponível.</p>
                            </Col>
                          ) : (
                            items.map((item) => (
                              <Col md={4} key={item.id}>
                                <Form.Check
                                  type="checkbox"
                                  id={`service-${item.id}`}
                                  label={item.name}
                                  // Adicionamos value e checked para garantir controle total via state
                                  value={item.id}
                                  checked={appointmentData.service_ids.includes(item.id)}
                                  onChange={handleServiceSelection}
                                />
                              </Col>
                            ))
                          )}
                        </Row>
                      </Col>

                      {/* Data/hora */}
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="scheduled_at">
                          <Form.Label>Data e Hora</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="scheduled_at"
                            value={appointmentData.scheduled_at}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Barbeiro */}
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="provider_id">
                          <Form.Label>Barbeiro</Form.Label>
                          <Form.Control
                            as="select"
                            name="provider_id"
                            value={appointmentData.provider_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            {barbers.map((barber) => (
                              <option key={barber.user_id} value={barber.user_id}>
                                {barber.first_name}
                              </option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      {/* Observações */}
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="notes">
                          <Form.Label>Observações</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={appointmentData.notes}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center">
                      <Button variant="primary" type="submit" className="action-button">
                        {isProcessing ? "Agendando..." : "Agendar"}
                      </Button>
                    </div>

                    {/* Exibe mensagens, se existirem */}
                    {messages.length > 0 && (
                      <div className="mt-3">
                        {messages.map((message, index) => (
                          <div key={index}>{message}</div>
                        ))}
                      </div>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AppointmentCreatePage;

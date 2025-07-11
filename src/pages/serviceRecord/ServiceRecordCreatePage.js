import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";

const ServiceRecordCreatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [barbershop, setBarbershop] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [barbershopId, setBarbershopId] = useState(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);

  // Dados do registro de atendimento
  const [serviceRecordData, setServiceRecordData] = useState({
    provider_id: "",
    discount: 0,
    payment_method: "",
    total_price: "",
    notes: "",
    service_ids: [],
  });

  useEffect(() => {
    const fetchBarbershop = async () => {
      setMessages(["Carregando informações da barbearia e serviços..."]);
      try {
        const response = await axios.get(
          `${apiBaseUrl}/barbershop/view/${slug}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const barbershopData = response.data.barbershop || response.data;
        setBarbershop(barbershopData);
        setBarbershopId(barbershopData.id);
        setServices(response.data.services || []); // Usa os serviços retornados
        setBarbers(response.data.barbers || []);
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
        setMessages([]);
      }
    };

    if (slug) {
      fetchBarbershop();
    }
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceRecordData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleServiceSelection = (e) => {
    const serviceId = parseInt(e.target.value);
    const checked = e.target.checked;
    setServiceRecordData((prevData) => {
      let updatedServices = [...prevData.service_ids];
      if (checked) {
        updatedServices.push(serviceId);
      } else {
        updatedServices = updatedServices.filter((id) => id !== serviceId);
      }
      return { ...prevData, service_ids: updatedServices };
    });
  };

  const validateFields = () => {
    const errors = [];
    if (!serviceRecordData.provider_id) {
      errors.push("Selecione um barbeiro para o atendimento.");
    }
    if (serviceRecordData.service_ids.length === 0) {
      errors.push("Selecione ao menos um serviço.");
    }
    if (!serviceRecordData.payment_method) {
      errors.push("Selecione o método de pagamento.");
    }
    if (!serviceRecordData.total_price) {
      errors.push("Informe o valor total do atendimento.");
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
    setMessages(["Aguarde enquanto registramos o atendimento..."]);

    // Tenta obter o client_id a partir de /auth/me
    let clientId;
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
      service_ids: serviceRecordData.service_ids,
      provider_id: serviceRecordData.provider_id,
      client_id: clientId,
      registered_by: clientId,
      discount: serviceRecordData.discount || 0,
      payment_method: serviceRecordData.payment_method,
      total_price: serviceRecordData.total_price,
      status: "pending",
      notes: serviceRecordData.notes,
    };

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      };

      await axios.post(`${apiBaseUrl}/service-record`, payload, { headers });
      Swal.fire({
        title: "Sucesso!",
        text: "Atendimento registrado com sucesso!",
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
      console.error("Erro ao registrar atendimento:", error);
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
          text: "Ocorreu um erro ao registrar o atendimento. Tente novamente mais tarde.",
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
      <p className="section-title text-center">Registrar Atendimento</p>
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            {isProcessing ? (
              <div className="loading-section">
                <ProcessingIndicatorComponent messages={messages} />
              </div>
            ) : (
              <Card className="card-component service-record-create-card shadow-sm">
                <Card.Body className="card-body service-record-create-card-body">
                  {barbershop && (
                    <p className="mb-3 text-center">
                      Registro de atendimento em:{" "}
                      <strong>{barbershop.name}</strong>
                    </p>
                  )}
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      {/* Seleção de Serviços */}
                      <Col md={12} className="mb-4">
                        <p className="mb-2">Selecione os Serviços</p>
                        <Row>
                          {services.length === 0 ? (
                            <Col xs={12}>
                              <p>Nenhum serviço disponível.</p>
                            </Col>
                          ) : (
                            services.map((service) => (
                              <Col md={4} key={service.id}>
                                <Form.Check
                                  type="checkbox"
                                  id={`service-${service.id}`}
                                  label={service.name}
                                  value={service.id}
                                  checked={serviceRecordData.service_ids.includes(
                                    service.id
                                  )}
                                  onChange={handleServiceSelection}
                                />
                              </Col>
                            ))
                          )}
                        </Row>
                      </Col>

                      {/* Seleção do Prestador */}
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="provider_id">
                          <Form.Label>Barbeiro</Form.Label>
                          <Form.Control
                            as="select"
                            name="provider_id"
                            value={serviceRecordData.provider_id}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            {barbers.map((barber) => (
                              <option
                                key={barber.user_id}
                                value={barber.user_id}
                              >
                                {barber.first_name}
                              </option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      {/* Método de Pagamento */}
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="payment_method">
                          <Form.Label>Método de Pagamento</Form.Label>
                          <Form.Control
                            as="select"
                            name="payment_method"
                            value={serviceRecordData.payment_method}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="Pix">Pix</option>
                            <option value="Débito">Débito</option>
                            <option value="Crédito">Crédito</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Fiado">Fiado</option>
                            <option value="Cortesia">Cortesia</option>
                            <option value="Transferência bancária">
                              Transferência bancária
                            </option>
                            <option value="Vale-refeição">Vale-refeição</option>
                            <option value="Cheque">Cheque</option>
                            <option value="PayPal">PayPal</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      {/* Valor Total */}
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="total_price">
                          <Form.Label>Valor Total (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="total_price"
                            value={serviceRecordData.total_price}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Desconto */}
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="discount">
                          <Form.Label>Desconto (R$)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="discount"
                            value={serviceRecordData.discount}
                            onChange={handleInputChange}
                          />
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
                            value={serviceRecordData.notes}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center">
                      <Button
                        variant="primary"
                        type="submit"
                        className="action-button"
                      >
                        {isProcessing
                          ? "Registrando..."
                          : "Registrar Atendimento"}
                      </Button>
                    </div>

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

export default ServiceRecordCreatePage;

import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

const ServiceRecordViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [serviceRecord, setServiceRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceRecord = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiBaseUrl}/service-record/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        // Considerando que a API retorne o registro como "service_record"
        setServiceRecord(response.data.service_record || response.data);
        window.scrollTo(0, 0);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Erro ao carregar atendimento.";
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

    if (id) {
      fetchServiceRecord();
    }
  }, [id]);

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent messages={["Carregando atendimento..."]} />
      ) : serviceRecord ? (
        <Container className="main-container" fluid>
          <Card className="card-component shadow-sm">
            <Card.Body>
              <Row>
                <Col md={12}>
                  <h3 className="mb-3">Detalhes do Atendimento</h3>
                  <p>
                    <strong>ID:</strong> {serviceRecord.id}
                  </p>
                  <p>
                    <strong>Entidade:</strong> {serviceRecord.entity_name} (ID: {serviceRecord.entity_id})
                  </p>
                  <p>
                    <strong>Serviços:</strong>{" "}
                    {serviceRecord.service_names && serviceRecord.service_names.length > 0
                      ? serviceRecord.service_names.join(", ")
                      : "Não informado"}
                  </p>
                  <p>
                    <strong>Prestador:</strong>{" "}
                    {serviceRecord.provider_first_name || "Não identificado"}
                  </p>
                  <p>
                    <strong>Cliente:</strong>{" "}
                    {serviceRecord.client_first_name || "Não identificado"}
                  </p>
                  <p>
                    <strong>Registrado por:</strong>{" "}
                    {serviceRecord.registered_by_first_name || "Não identificado"}
                  </p>
                  <p>
                    <strong>Desconto:</strong> R$ {serviceRecord.discount}
                  </p>
                  <p>
                    <strong>Método de Pagamento:</strong> {serviceRecord.payment_method}
                  </p>
                  <p>
                    <strong>Valor Total:</strong> R$ {serviceRecord.total_price}
                  </p>
                  <p>
                    <strong>Status:</strong> {serviceRecord.status}
                  </p>
                  <p>
                    <strong>Observações:</strong>{" "}
                    {serviceRecord.notes || "Nenhuma"}
                  </p>
                  <p>
                    <strong>Criado em:</strong>{" "}
                    {new Date(serviceRecord.created_at).toLocaleString("pt-BR")}
                  </p>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Button variant="primary" onClick={() => navigate(-1)}>
                    Voltar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      ) : (
        <Container className="main-container" fluid>
          <Row className="justify-content-center">
            <Col xs={12} className="text-center">
              <p>Atendimento não encontrado.</p>
              <Button variant="primary" onClick={() => navigate(-1)}>
                Voltar
              </Button>
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
};

export default ServiceRecordViewPage;

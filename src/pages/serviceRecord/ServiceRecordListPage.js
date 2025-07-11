import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

// Returns a custom CSS class for the card based on the status
const getCardClass = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "service-record-card-pending";
  if (s === "approved") return "service-record-card-approved";
  if (s === "not-approved") return "service-record-card-not-approved";
  return "";
};

// Returns a custom CSS class for the status update button based on the new status
const getButtonClass = (newStatus) => {
  if (!newStatus) return "";
  const s = newStatus.toLowerCase();
  if (s === "approved") return "service-record-btn-approved";
  if (s === "not-approved") return "service-record-btn-not-approved";
  return "";
};

const getStatusName = (status) => {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "pending") return "Pendente";
  if (s === "approved") return "Aprovado";
  if (s === "not-approved") return "Não Aprovado";
  return "";
};

const ServiceRecordListPage = () => {
  // The route may include "slug" (barbershop) or "username" (barber) or none ("meus atendimentos")
  const { slug, username } = useParams();
  const navigate = useNavigate();

  const [headerInfo, setHeaderInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  // Default filter status is "approved"
  const [filterStatus, setFilterStatus] = useState("approved");

  // Determine if the "Registrar Atendimento" (Create Service Record) button should be shown.
  // This button should be visible only if the route is for a barbershop or a barber.
  const showCreateButton = Boolean(slug || username);

  // Enrich each service record with details from related users
  const enrichRecords = async (recordsData) => {
    const token = localStorage.getItem("token");
    const enriched = await Promise.all(
      recordsData.map(async (record) => {
        let enrichedRecord = { ...record };

        // Client
        if (record.client_id) {
          try {
            const res = await axios.get(`${apiBaseUrl}/user/show/${record.client_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.client_first_name =
              res.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.client_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.client_first_name = "Não identificado";
        }

        // Provider (barber)
        if (record.provider_id) {
          try {
            const res = await axios.get(`${apiBaseUrl}/user/show/${record.provider_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.provider_first_name =
              res.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.provider_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.provider_first_name = "Não identificado";
        }

        // Registered by (the user who registered the record)
        if (record.registered_by) {
          try {
            const res = await axios.get(`${apiBaseUrl}/user/show/${record.registered_by}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            enrichedRecord.registered_by_first_name =
              res.data.user.first_name || "Não identificado";
          } catch (error) {
            enrichedRecord.registered_by_first_name = "Não identificado";
          }
        } else {
          enrichedRecord.registered_by_first_name = "Não identificado";
        }

        return enrichedRecord;
      })
    );
    return enriched;
  };

  // Sort records by creation date
  const sortRecords = (data) => {
    return data.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
  };

  // Function to update the status with confirmation via SweetAlert
  const handleStatusUpdate = (recordId, newStatus) => {
    Swal.fire({
      title: "Confirmar alteração",
      text: `Deseja realmente alterar o status para ${
        newStatus === "approved" ? "Aprovado" : "Não Aprovado"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, alterar",
      cancelButtonText: "Cancelar",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.patch(
            `${apiBaseUrl}/service-record/${recordId}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          Swal.fire({
            title: "Atualizado",
            text: "Status do atendimento atualizado com sucesso!",
            icon: "success",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
          setRecords((prev) =>
            prev.map((record) =>
              record.id === recordId ? { ...record, status: newStatus } : record
            )
          );
        } catch (error) {
          Swal.fire({
            title: "Erro",
            text:
              error.response?.data?.error ||
              "Erro ao atualizar o status do atendimento. Tente novamente.",
            icon: "error",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
        }
      }
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchRecords = async () => {
      setMessages(["Carregando atendimentos..."]);
      try {
        let res, data;
        if (slug) {
          // Fetch service records for a barbershop
          const resBarbershop = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const barbershopData = resBarbershop.data.barbershop || resBarbershop.data;
          setHeaderInfo(barbershopData);
          const params = {
            entity_id: barbershopData.id,
            entity_name: "barbershop",
          };
          res = await axios.get(`${apiBaseUrl}/service-record/listbyentity`, {
            headers: { Authorization: `Bearer ${token}` },
            params,
          });
          data = res.data.service_records || [];
        } else if (username) {
          // Fetch service records for a barber
          const resBarber = await axios.get(`${apiBaseUrl}/barber/view/${username}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const barberData = resBarber.data.barbershop ? resBarber.data : resBarber.data;
          setHeaderInfo(barberData);
          const params = {
            provider_id: barberData.user_id,
            app_id: 1,
            entity_name: "barbershop",
            entity_id: barberData.barbershops[0]?.id,
          };
          res = await axios.get(`${apiBaseUrl}/service-record/listbyprovider`, {
            headers: { Authorization: `Bearer ${token}` },
            params,
          });
          data = res.data.service_records || [];
        } else {
          // Fetch my service records
          res = await axios.get(`${apiBaseUrl}/service-record/listmy`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          data = res.data.service_records || [];
        }
        const sorted = sortRecords(data);
        const enriched = await enrichRecords(sorted);
        setRecords(enriched);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text:
            error.response?.data?.message ||
            "Erro ao carregar os atendimentos.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
        setRecords([]);
      } finally {
        setMessages([]);
        setLoading(false);
      }
    };

    fetchRecords();
  }, [slug, username, navigate]);

  let headerTitle = "";
  if (slug && headerInfo) {
    headerTitle = `Atendimentos da ${headerInfo.name}`;
  } else if (username && headerInfo) {
    headerTitle = `Atendimentos do barbeiro ${headerInfo.user.first_name}`;
  } else {
    headerTitle = "Meus Atendimentos";
  }

  const pendingCount = records.filter(
    (record) => record.status && record.status.toLowerCase() === "pending"
  ).length;
  const approvedCount = records.filter(
    (record) => record.status && record.status.toLowerCase() === "approved"
  ).length;
  const notApprovedCount = records.filter(
    (record) => record.status && record.status.toLowerCase() === "not-approved"
  ).length;

  const filteredRecords = records.filter(
    (record) =>
      record.status &&
      record.status.toLowerCase() === filterStatus.toLowerCase()
  );

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">{headerTitle}</p>
      <Container className="main-container" fluid>
        <Row className="mb-3 justify-content-between align-items-center">
          {showCreateButton && (
            <Col xs="auto">
              <Button
                className="action-button service-record-btn-create"
                onClick={() =>
                  navigate(`/service-record/create/${slug ? slug : username ? username : ""}`)
                }
              >
                Registrar Atendimento
              </Button>
            </Col>
          )}
        </Row>
        {/* Status filters */}
        <Row className="mb-3 justify-content-center">
          <Col xs="auto">
            <Button
              className={`action-button service-record-btn-approved ${filterStatus === "approved" ? "active" : ""}`}
              onClick={() => setFilterStatus("approved")}
            >
              Aprovados ({approvedCount})
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              className={`action-button service-record-btn-pending ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => setFilterStatus("pending")}
            >
              Pendentes ({pendingCount})
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              className={`action-button service-record-btn-not-approved ${filterStatus === "not-approved" ? "active" : ""}`}
              onClick={() => setFilterStatus("not-approved")}
            >
              Não Aprovados ({notApprovedCount})
            </Button>
          </Col>
        </Row>
        {loading ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Row className="section-row justify-content-center">
            <Col xs={12} lg={10} className="section-col">
              {filteredRecords.length === 0 ? (
                <Row>
                  <Col className="text-center">
                    <p className="text-white">
                      Nenhum atendimento encontrado para o status selecionado.
                    </p>
                    <Button
                      className="action-button"
                      onClick={() => navigate(-1)}
                    >
                      Voltar
                    </Button>
                  </Col>
                </Row>
              ) : (
                <Row className="inner-row">
                  {filteredRecords.map((record) => (
                    <Col md={4} key={record.id} className="inner-col mb-3">
                      <Card className={`card-component shadow-sm h-100 ${getCardClass(record.status)}`}>
                        <p className="text-center">{getStatusName(record.status)}</p>
                        <Card.Body>
                          <Card.Title className="mb-2">Atendimento #{record.id}</Card.Title>
                          <Card.Text>
                            <strong>Criado:</strong> {new Date(record.created_at).toLocaleString("pt-BR")}<br />
                            <strong>Cliente:</strong> {record.client_first_name}<br />
                            <strong>Barbeiro:</strong> {record.provider_first_name}<br />
                            <strong>Registrado por:</strong> {record.registered_by_first_name}<br />
                            <strong>Serviços:</strong>{" "}
                            {record.services && record.services.length > 0
                              ? record.services
                                  .map((service) => `${service.id} - ${service.name}`)
                                  .join(", ")
                              : "Não informado"}<br />
                            <strong>Valor Total:</strong> {record.total_price}<br />
                            <strong>Desconto:</strong> {record.discount}<br />
                            <strong>Método de Pagamento:</strong> {record.payment_method}
                          </Card.Text>
                          {record.status.toLowerCase() === "pending" && (
                            <div className="d-flex gap-2 mt-2">
                              <Button
                                className={`action-button ${getButtonClass("approved")}`}
                                onClick={() => handleStatusUpdate(record.id, "approved")}
                              >
                                Aprovar
                              </Button>
                              <Button
                                className={`action-button ${getButtonClass("not-approved")}`}
                                onClick={() => handleStatusUpdate(record.id, "not-approved")}
                              >
                                Não Aprovar
                              </Button>
                            </div>
                          )}
                        </Card.Body>
                        <Card.Footer>
                          <small className="text-primary">
                            Criado em: {new Date(record.created_at).toLocaleString("pt-BR")}
                          </small>
                        </Card.Footer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
};

export default ServiceRecordListPage;

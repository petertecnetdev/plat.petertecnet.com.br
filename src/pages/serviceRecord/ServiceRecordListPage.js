import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "Concluído";
  if (value === "pending") return "Pendente";
  if (value === "not-approved") return "Cancelado";
  return status || "Sem status";
};

export default function ServiceRecordListPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await axios.get(`${apiBaseUrl}/service-record/listmy`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(data?.service_records) ? data.service_records : [];
        setRecords([...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (error) {
        setRecords([]);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.response?.data?.message || "Não foi possível carregar os atendimentos.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    return records.filter((record) => String(record.status || "").toLowerCase() === filter);
  }, [records, filter]);

  const counts = useMemo(() => ({
    all: records.length,
    pending: records.filter((r) => String(r.status || "").toLowerCase() === "pending").length,
    approved: records.filter((r) => String(r.status || "").toLowerCase() === "approved").length,
    cancelled: records.filter((r) => String(r.status || "").toLowerCase() === "not-approved").length,
  }), [records]);

  return (
    <>
      <NavlogComponent />
      <p className="section-title">Atendimentos presenciais</p>
      <Container className="main-container" fluid>
        {loading ? (
          <ProcessingIndicatorComponent messages={["Carregando atendimentos…"]} />
        ) : (
          <>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <Button className="action-button" onClick={() => setFilter("all")}>Todos ({counts.all})</Button>
              <Button variant="secondary" onClick={() => setFilter("pending")}>Pendentes ({counts.pending})</Button>
              <Button variant="secondary" onClick={() => setFilter("approved")}>Concluídos ({counts.approved})</Button>
              <Button variant="secondary" onClick={() => setFilter("not-approved")}>Cancelados ({counts.cancelled})</Button>
            </div>

            {filtered.length === 0 ? (
              <Card className="card-component">
                <Card.Body className="text-center py-5">
                  <h5>Nenhum atendimento encontrado</h5>
                  <p className="text-muted mb-0">Os atendimentos presenciais registrados na Plat aparecerão aqui.</p>
                </Card.Body>
              </Card>
            ) : (
              <Row className="g-3">
                {filtered.map((record) => (
                  <Col xs={12} md={6} xl={4} key={record.id}>
                    <Card className="card-component h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                          <div>
                            <small className="text-muted">Atendimento</small>
                            <h5 className="mb-0">#{record.id}</h5>
                          </div>
                          <span className="badge bg-secondary">{statusLabel(record.status)}</span>
                        </div>
                        <p className="mb-2"><strong>Valor:</strong> R$ {Number(record.total_price || 0).toFixed(2).replace(".", ",")}</p>
                        <p className="mb-2"><strong>Pagamento:</strong> {record.payment_method || "Não informado"}</p>
                        <p className="mb-2"><strong>Desconto:</strong> R$ {Number(record.discount || 0).toFixed(2).replace(".", ",")}</p>
                        <p className="text-muted small mb-3">{record.created_at ? new Date(record.created_at).toLocaleString("pt-BR") : ""}</p>
                        <Button as={Link} to={`/service-record/view/${record.id}`} variant="secondary" size="sm">Ver detalhes</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Container>
    </>
  );
}

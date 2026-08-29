import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl } from "../../config";

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (["approved", "completed"].includes(value)) return "Concluído";
  if (value === "pending") return "Pendente";
  if (["not-approved", "cancelled"].includes(value)) return "Cancelado";
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
          params: { per_page: 100 },
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRecords([...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      } catch (error) {
        setRecords([]);
        Swal.fire("Erro", error?.response?.data?.message || error?.response?.data?.error || "Não foi possível carregar os atendimentos.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const filtered = useMemo(() => {
    if (filter === "all") return records;
    if (filter === "completed") return records.filter((r) => ["approved", "completed"].includes(String(r.status || "").toLowerCase()));
    if (filter === "cancelled") return records.filter((r) => ["not-approved", "cancelled"].includes(String(r.status || "").toLowerCase()));
    return records.filter((r) => String(r.status || "").toLowerCase() === filter);
  }, [records, filter]);

  const counts = useMemo(() => ({
    all: records.length,
    pending: records.filter((r) => String(r.status || "").toLowerCase() === "pending").length,
    completed: records.filter((r) => ["approved", "completed"].includes(String(r.status || "").toLowerCase())).length,
    cancelled: records.filter((r) => ["not-approved", "cancelled"].includes(String(r.status || "").toLowerCase())).length,
  }), [records]);

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <div className="mb-4"><span className="text-muted">Operação</span><h1 className="page-header mb-0">Atendimentos presenciais</h1></div>
        {loading ? <ProcessingIndicatorComponent compact messages={["Carregando atendimentos…"]} /> : <>
          <div className="d-flex flex-wrap gap-2 mb-4">
            <Button variant={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter("all")}>Todos ({counts.all})</Button>
            <Button variant={filter === "pending" ? "primary" : "secondary"} onClick={() => setFilter("pending")}>Pendentes ({counts.pending})</Button>
            <Button variant={filter === "completed" ? "primary" : "secondary"} onClick={() => setFilter("completed")}>Concluídos ({counts.completed})</Button>
            <Button variant={filter === "cancelled" ? "primary" : "secondary"} onClick={() => setFilter("cancelled")}>Cancelados ({counts.cancelled})</Button>
          </div>
          {filtered.length === 0 ? <Card className="card-component"><Card.Body className="text-center py-5"><h5>Nenhum atendimento encontrado</h5><p className="text-muted mb-0">Os atendimentos presenciais registrados aparecerão aqui.</p></Card.Body></Card> : <Row className="g-3">{filtered.map((record) => <Col xs={12} md={6} xl={4} key={record.id}><Card className="card-component h-100"><Card.Body><div className="d-flex justify-content-between mb-3"><div><small className="text-muted">Atendimento</small><h5>#{record.id}</h5></div><span className="badge bg-secondary">{statusLabel(record.status)}</span></div><p><strong>Cliente:</strong> {record.client?.first_name || "Não informado"}</p><p><strong>Prestador:</strong> {record.provider?.first_name || "Não informado"}</p><p><strong>Valor:</strong> R$ {Number(record.total_price || 0).toFixed(2).replace(".", ",")}</p><p><strong>Pagamento:</strong> {record.payment_method || "Não informado"}</p>{Array.isArray(record.services) && record.services.length > 0 && <p><strong>Itens/serviços:</strong> {record.services.map((service) => service.name).join(", ")}</p>}<p className="text-muted small mb-0">{record.created_at ? new Date(record.created_at).toLocaleString("pt-BR") : ""}</p></Card.Body></Card></Col>)}</Row>}
        </>}
      </Container>
    </>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, appId } from "../../config";
import "./Order.css";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
const apiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") || fallback;
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function OrderEditPage() {
  const { entityId, id: orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [form, setForm] = useState({ payment_status: "pending", payment_method: "Dinheiro", status: "pending", notes: "" });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const headers = authHeaders();
        const [estRes, orderRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, { params: { app_id: appId }, headers }),
          axios.get(`${apiBaseUrl}/order/${orderId}`, { headers }),
        ]);
        const est = estRes.data?.establishment || estRes.data;
        const loadedOrder = orderRes.data?.order || orderRes.data;
        if (!est?.id || Number(est.app_id) !== Number(appId)) throw new Error("Estabelecimento inválido para a Plat.");
        if (!loadedOrder?.id || Number(loadedOrder.entity_id) !== Number(est.id) || loadedOrder.entity_name !== "establishment") throw new Error("Pedido não pertence a este estabelecimento.");
        if (!mounted) return;
        setEstablishment(est);
        setOrder(loadedOrder);
        setForm({
          payment_status: loadedOrder.payment_status || "pending",
          payment_method: loadedOrder.payment_method || "Dinheiro",
          status: loadedOrder.status || "pending",
          notes: loadedOrder.notes || "",
        });
      } catch (error) {
        await Swal.fire("Erro", apiMessage(error, "Não foi possível carregar o pedido."), "error");
        navigate(`/order/list/${entityId}`, { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [entityId, orderId, navigate]);

  const totalItems = useMemo(() => (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0), [order]);
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.put(`${apiBaseUrl}/order/${orderId}`, form, { headers: authHeaders() });
      setOrder((current) => ({ ...current, ...(data?.order || {}), ...form }));
      await Swal.fire("Sucesso", data?.message || "Pedido atualizado com sucesso.", "success");
      navigate(`/order/list/${entityId}`);
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível atualizar o pedido."), error?.response?.status === 422 ? "warning" : "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="d-flex justify-content-center mt-5"><Spinner animation="border" /></div>;

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div><span className="text-muted">{establishment?.name}</span><h1 className="page-header mb-0">Pedido #{order?.order_number || order?.id}</h1></div>
          <Button as={Link} to={`/order/list/${entityId}`} variant="secondary">Voltar aos pedidos</Button>
        </div>

        <Row className="g-4">
          <Col lg={5}>
            <section className="card-container h-100">
              <h2 className="h5 mb-3">Dados do pedido</h2>
              <div className="mb-3"><small className="text-muted">Cliente</small><div>{order?.customer_name || "Não informado"}</div></div>
              <div className="mb-3"><small className="text-muted">Origem</small><div>{order?.origin || "—"}</div></div>
              <div className="mb-3"><small className="text-muted">Tipo de consumo</small><div>{order?.fulfillment || "—"}</div></div>
              <div className="mb-3"><small className="text-muted">Itens</small><div>{totalItems}</div></div>
              <div><small className="text-muted">Total</small><div className="h4 mb-0">{money(order?.total_price)}</div></div>
            </section>
          </Col>

          <Col lg={7}>
            <Form className="card-container" onSubmit={save}>
              <h2 className="h5 mb-3">Atualizar pedido</h2>
              <Row className="g-3">
                <Col md={6}><Form.Label>Status do pedido</Form.Label><Form.Select value={form.status} onChange={change("status")}><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="preparing">Em preparo</option><option value="ready">Pronto</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></Form.Select></Col>
                <Col md={6}><Form.Label>Status do pagamento</Form.Label><Form.Select value={form.payment_status} onChange={change("payment_status")}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="refunded">Estornado</option><option value="cancelled">Cancelado</option></Form.Select></Col>
                <Col md={6}><Form.Label>Método de pagamento</Form.Label><Form.Select value={form.payment_method} onChange={change("payment_method")}><option value="Dinheiro">Dinheiro</option><option value="Pix">Pix</option><option value="Débito">Débito</option><option value="Crédito">Crédito</option><option value="Vale-refeição">Vale-refeição</option><option value="Cortesia">Cortesia</option></Form.Select></Col>
                <Col xs={12}><Form.Label>Observações</Form.Label><Form.Control as="textarea" rows={4} value={form.notes} onChange={change("notes")} /></Col>
                <Col xs={12} className="text-end"><Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : "Salvar alterações"}</Button></Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
}

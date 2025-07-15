// src/pages/order/OrderListPage.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Table,
  Form
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

export default function OrderListPage() {
  const { entityId } = useParams();
  const [orders, setOrders] = useState([]);
  const [estName, setEstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: "",
    time: "",
    customer: "",
    item: ""
  });

  const fulfillmentLabels = {
    "dine-in": "Local",
    "take-away": "Levar",
    delivery: "Delivery"
  };

  const paymentStatusLabels = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falha",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    partially_refunded: "Parcialmente Reembolsado"
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      try {
        const [resOrders, resEst] = await Promise.all([
          axios.get(`${apiBaseUrl}/order/listbyentity`, {
            params: { app_id: 3, entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setOrders(resOrders.data.orders);
        setEstName(resEst.data.establishment.name.toUpperCase());
      } catch (err) {
        Swal.fire("Erro", err.response?.data?.error || "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const buildReceipt = (order) => {
    const WIDTH = 42;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };
    const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
    const consLabel = fulfillmentLabels[order.fulfillment] || order.fulfillment;
    const L = [];
    L.push("█".repeat(WIDTH));
    L.push(estName.padStart((WIDTH + estName.length) / 2));
    L.push("█".repeat(WIDTH));
    L.push("");
    L.push("ITENS DO PEDIDO".padStart((WIDTH + 15) / 2));
    L.push("-".repeat(WIDTH));
    order.items.forEach((i) => {
      const qty = `${i.quantity}x`;
      L.push(pad(`${qty} ${i.item.name}`, fmt(i.subtotal || 0)));
      i.modifiers.forEach((m) =>
        L.push((m.type === "addition" ? "+ " : "- ") + m.modifier.name)
      );
    });
    L.push("-".repeat(WIDTH));
    L.push(pad("TOTAL", fmt(order.total_price)));
    L.push("");
    L.push(`Origem: ${order.origin} | Consumo: ${consLabel}`);
    L.push(`Data: ${new Date(order.order_datetime).toLocaleString("pt-BR",{ hour12: false })}`);
    return L.join("\n");
  };

  const handleReprint = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${apiBaseUrl}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const receiptText = buildReceipt(data.order);
      Swal.fire({
        title: `Recibo Pedido #${data.order.order_number}`,
        html: `
          <style>
            .swal2-html-container { font-family: monospace; white-space: pre; text-align: left; }
          </style>
          <div class="print-area"><pre>${receiptText}</pre></div>
        `,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
        cancelButtonText: "Fechar"
      }).then((res) => {
        if (res.isConfirmed) {
          const w = window.open("", "_blank", "width=200,height=600");
          w.document.write(`
            <html><head><title>Recibo</title>
            <style>@page{margin:0;}body{margin:4px;font-family:monospace;font-size:12px;}pre{margin:0;}</style>
            </head><body><pre>${receiptText}</pre></body></html>
          `);
          w.document.close();
          w.focus();
          w.print();
          w.print();
          w.close();
        }
      });
    } catch {
      Swal.fire("Erro", "Não foi possível reimprimir a nota.", "error");
    }
  };

  const filteredOrders = useMemo(() =>
    orders.filter((o) => {
      const dt = new Date(o.order_datetime);
      const dateMatch = filters.date ? dt.toISOString().slice(0,10) === filters.date : true;
      const timeMatch = filters.time ? dt.toTimeString().slice(0,5) === filters.time : true;
      const custMatch = o.customer_name.toLowerCase().includes(filters.customer.toLowerCase());
      const itemMatch = filters.item
        ? o.items.some((i) => i.item.name.toLowerCase().includes(filters.item.toLowerCase()))
        : true;
      return dateMatch && timeMatch && custMatch && itemMatch;
    })
  , [orders, filters]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Carregando pedidos...
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container className="mt-4">
        <Row className="mb-3">
          <Col><h3>Pedidos do Estabelecimento</h3></Col>
          <Col className="text-end">
            <Link to="/dashboard"><Button variant="secondary">Voltar</Button></Link>
          </Col>
        </Row>
        <Form className="mb-4">
          <Row className="g-3">
            <Col md={3}>
              <Form.Label>Data</Form.Label>
              <Form.Control
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Hora</Form.Label>
              <Form.Control
                type="time"
                value={filters.time}
                onChange={(e) => setFilters(f => ({ ...f, time: e.target.value }))}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Cliente</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome do cliente"
                value={filters.customer}
                onChange={(e) => setFilters(f => ({ ...f, customer: e.target.value }))}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Item</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome do item"
                value={filters.item}
                onChange={(e) => setFilters(f => ({ ...f, item: e.target.value }))}
              />
            </Col>
          </Row>
        </Form>
        <div className="d-none d-md-block">
          <Table striped bordered hover responsive className="table-list-order">
            <thead>
              <tr>
                <th>#</th>
                <th>Data/Hora</th>
                <th>Cliente</th>
                <th>Origem</th>
                <th>Consumo</th>
                <th>Status Pgto</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody className="text-dark">
              {filteredOrders.map((o) => (
                <tr key={o.id} >
                  <td>{o.order_number}</td>
                  <td>{new Date(o.order_datetime).toLocaleString("pt-BR",{ hour12: false })}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.origin}</td>
                  <td>{fulfillmentLabels[o.fulfillment] || o.fulfillment}</td>
                  <td>{paymentStatusLabels[o.payment_status] || o.payment_status}</td>
                  <td>R${" "}{parseFloat(o.total_price).toFixed(2).replace(".",",")}</td>
                  <td className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => Swal.fire({
                        title: `Detalhes Pedido #${o.order_number}`,
                        html: `<pre style="font-family:monospace;white-space:pre-wrap">
${o.items.map(i => {
  const line = `${i.quantity}x ${i.item.name} — R$${parseFloat(i.subtotal).toFixed(2).replace(".",",")}`;
  const mods = i.modifiers.map(m => m.type === "addition" ? `+${m.modifier.name}` : `−${m.modifier.name}`);
  return mods.length ? `${line}\n  (${mods.join(", ")})` : line;
}).join("\n")}
\n\nTOTAL — R$${parseFloat(o.total_price).toFixed(2).replace(".",",")}
                        </pre>`
                      })}
                    >
                      Ver Itens
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleReprint(o.id)}>
                      Imprimir Nota
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="d-block d-md-none">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="mb-3 shadow-sm">
              <Card.Header>
                Pedido #{o.order_number} — {new Date(o.order_datetime).toLocaleString("pt-BR",{ hour12: false })}
              </Card.Header>
              <Card.Body>
                <div>Cliente: {o.customer_name}</div>
                <div>Origem: {o.origin}</div>
                <div>Consumo: {fulfillmentLabels[o.fulfillment] || o.fulfillment}</div>
                <div>Status Pgto: {paymentStatusLabels[o.payment_status] || o.payment_status}</div>
                <div>Total: R${" "}{parseFloat(o.total_price).toFixed(2).replace(".",",")}</div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Link to={`/order/create/${entityId}`}><Button size="sm" variant="success">Novo Pedido</Button></Link>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => Swal.fire({
                      title: `Detalhes Pedido #${o.order_number}`,
                      html: `<pre style="font-family:monospace;white-space:pre-wrap">
${o.items.map(i => {
  const line = `${i.quantity}x ${i.item.name} — R$${parseFloat(i.subtotal).toFixed(2).replace(".",",")}`;
  const mods = i.modifiers.map(m => m.type === "addition" ? `+${m.modifier.name}` : `−${m.modifier.name}`);
  return mods.length ? `${line}\n  (${mods.join(", ")})` : line;
}).join("\n")}
\n\nTOTAL — R$${parseFloat(o.total_price).toFixed(2).replace(".",",")}
                      </pre>`
                    })}
                  >
                    Ver Itens
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleReprint(o.id)}>
                    Imprimir Nota
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}

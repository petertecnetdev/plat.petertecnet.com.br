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
  Form,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

export default function OrderListPage() {
  const { entityId } = useParams();
  const today = new Date().toISOString().slice(0, 10);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [estName, setEstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: today,
    endDate: today,
    startTime: "00:00",
    endTime: "23:59",
    customer: "",
    item: "",
  });

  const originLabels = {
    WhatsApp: "WhatsApp",
    Balcão: "Balcão",
    Telefone: "Telefone",
    App: "Aplicativo",
  };
  const fulfillmentLabels = {
    "dine-in": "Local",
    "take-away": "Levar",
    delivery: "Delivery",
  };
  const paymentStatusLabels = {
    pending: "Pendente",
    paid: "Pago",
    failed: "Falha",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    partially_refunded: "Parcialmente Reembolsado",
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      try {
        const [resOrders, resEst, resProducts] = await Promise.all([
          axios.get(`${apiBaseUrl}/order/listbyentity`, {
            params: {
              app_id: 3,
              entity_name: "establishment",
              entity_id: entityId,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/item`, {
            params: {
              entity_name: "establishment",
              entity_id: entityId,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setOrders(resOrders.data.orders);
        setEstName(resEst.data.establishment.name.toUpperCase());
        setProducts(resProducts.data);
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.error || "Não foi possível carregar dados.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);
const buildReceipt = (order) => {
  const header = estName; 
  const WIDTH = Math.max(28, header.length);
  const bar = "█".repeat(WIDTH);
  const line = () => "-".repeat(WIDTH);
  const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
  const padLine = (left, right) => {
    const dots = ".".repeat(Math.max(WIDTH - left.length - right.length, 0));
    return `${left}${dots}${right}`;
  };
  const center = (text) =>
    text.padStart((WIDTH + text.length) / 2).padEnd(WIDTH);

  const consLabel =
    fulfillmentLabels[order.fulfillment] || order.fulfillment;
  const origLabel = originLabels[order.origin] || order.origin;
  const L = [];

  L.push(bar);
  L.push(header);
  L.push(bar);
  L.push("");
  L.push(`👤 Cliente: ${(order.customer_name || "").toUpperCase()}`);
  L.push(`📦 Origem: ${origLabel.toUpperCase()}`);
  L.push(`🍽️ Consumo: ${consLabel.toUpperCase()}`);
  L.push(line());
  L.push(center("ITENS DO PEDIDO"));
  L.push(line());

  let total = 0;
  order.items.forEach((it) => {
    const qty = it.quantity;
    const name = it.item.name;
    const sub = Number(it.subtotal);
    total += sub;
    L.push(padLine(`${qty}x ${name}`, fmt(sub)));

    it.modifiers
      .filter((m) => m.type === "addition")
      .forEach((m) => {
        const prod = products.find((p) => p.id === m.modifier_id);
        const unit = prod ? Number(prod.price) : 0;
        const count = m.quantity || 1;
        const subAdd = unit * count;
        total += subAdd;
        L.push(padLine(`  + ${prod?.name || m.modifier.name}`, fmt(subAdd)));
      });

    it.modifiers
      .filter((m) => m.type === "removal")
      .forEach((m) => {
        L.push(`  - ${m.modifier.name}`);
      });
  });

  L.push(line());
  L.push(padLine("TOTAL", fmt(total)));
  L.push("");
  L.push(
    `Data: ${new Date(order.order_datetime).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })}`
  );
  L.push("");

  return L.join("\n");
};

const handleReprint = async (orderId) => {
  try {
    const token = localStorage.getItem("token");
    const { data } = await axios.get(`${apiBaseUrl}/order/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const receiptText = buildReceipt(data.order);
    Swal.fire({
      title: `Recibo Pedido #${data.order.order_number}`,
      html: `
        <style>
          .swal2-html-container {
            font-family: monospace;
            white-space: pre;
            text-align: left;
          }
        </style>
        <pre>${receiptText}</pre>
      `,
      showCancelButton: true,
      confirmButtonText: "Imprimir",
      cancelButtonText: "Fechar",
    }).then((res) => {
      if (res.isConfirmed) {
        const w = window.open("", "_blank", "fullscreen=yes");
        w.document.write(`
<html><head><title>Recibo</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  body {
    margin: 0;
    padding: 0;
    width: 80mm;
    font-family: monospace;
    font-size: 16px;
    line-height: 2.4;
  }
  pre { white-space: pre-wrap; word-wrap: break-word; }
</style>
</head><body><pre>${receiptText}


    


</pre></body></html>`);
        w.document.close();
        w.focus();
        w.print();
        w.close();
      }
    });
  } catch {
    Swal.fire("Erro", "Não foi possível reimprimir a nota.", "error");
  }
};

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const dt = new Date(o.order_datetime);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, "0");
        const day = String(dt.getDate()).padStart(2, "0");
        const date = `${year}-${month}-${day}`;
        const time = dt.toTimeString().slice(0, 5);
        const okDate = date >= filters.startDate && date <= filters.endDate;
        const okTime = time >= filters.startTime && time <= filters.endTime;
        const okCust = o.customer_name
          .toLowerCase()
          .includes(filters.customer.toLowerCase());
        const okItem = filters.item
          ? o.items.some((i) =>
              i.item.name.toLowerCase().includes(filters.item.toLowerCase())
            )
          : true;
        return okDate && okTime && okCust && okItem;
      }),
    [orders, filters]
  );

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
          <Col>
            <h3>Pedidos do Estabelecimento</h3>
          </Col>
          <Col className="text-end">
            <Link to="/dashboard">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </Col>
        </Row>
        <Form className="mb-4">
          <Row className="g-3">
            <Col md={2}>
              <Form.Label>Data Início</Form.Label>
              <Form.Control
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>Data Final</Form.Label>
              <Form.Control
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endDate: e.target.value }))
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>Hora Início</Form.Label>
              <Form.Control
                type="time"
                value={filters.startTime}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, startTime: e.target.value }))
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>Hora Final</Form.Label>
              <Form.Control
                type="time"
                value={filters.endTime}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>Cliente</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome do cliente"
                value={filters.customer}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, customer: e.target.value }))
                }
              />
            </Col>
            <Col md={2}>
              <Form.Label>Item</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome do item"
                value={filters.item}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, item: e.target.value }))
                }
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
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="align-middle">
                  <td>{o.order_number}</td>
                  <td>
                    {new Date(o.order_datetime).toLocaleString("pt-BR", {
                      hour12: false,
                    })}
                  </td>
                  <td>{o.customer_name}</td>
                  <td>{originLabels[o.origin]}</td>
                  <td>{fulfillmentLabels[o.fulfillment]}</td>
                  <td>{paymentStatusLabels[o.payment_status]}</td>
                  <td>
                    R$
                    {parseFloat(o.total_price).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="warning"
                      as={Link}
                      to={`/order/edit/${entityId}/${o.id}`}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReprint(o.id)}
                    >
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
                Pedido #{o.order_number} —{" "}
                {new Date(o.order_datetime).toLocaleString("pt-BR", {
                  hour12: false,
                })}
              </Card.Header>
              <Card.Body>
                <div>Cliente: {o.customer_name}</div>
                <div>Origem: {originLabels[o.origin]}</div>
                <div>Consumo: {fulfillmentLabels[o.fulfillment]}</div>
                <div>Status Pgto: {paymentStatusLabels[o.payment_status]}</div>
                <div>
                  Total: R$
                  {parseFloat(o.total_price).toFixed(2).replace(".", ",")}
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Link to={`/order/create/${entityId}`}>
                  <Button size="sm" variant="success">
                    Novo Pedido
                  </Button>
                </Link>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="warning"
                    as={Link}
                    to={`/order/edit/${entityId}/${o.id}`}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReprint(o.id)}
                  >
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

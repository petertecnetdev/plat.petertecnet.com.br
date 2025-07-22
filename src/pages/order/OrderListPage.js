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
  Badge,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

export default function OrderListPage() {
  const { entityId } = useParams();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
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
    Balcão: "Balcão",
    WhatsApp: "WhatsApp",
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
    failed: "Falhou",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    partially_refunded: "Parcialmente Reembolsado",
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const [resOrders, resEst, resProducts] = await Promise.all([
          axios.get(`${apiBaseUrl}/order/listbyentity`, {
            params: { app_id: 3, entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setOrders(resOrders.data.orders);
        setEstName(resEst.data.establishment.name.toUpperCase());
        setEstLogo(resEst.data.establishment.logo || "");
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
  const WIDTH = Math.max(32, header.length);
  const bar = "█".repeat(WIDTH);
  const line = () => "-".repeat(WIDTH);
  const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
  const padLine = (left, right) => {
    const dots = ".".repeat(Math.max(WIDTH - left.length - right.length, 0));
    return `${left}${dots}${right}`;
  };
  const center = (text) =>
    text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);
  const consLabel = fulfillmentLabels[order.fulfillment] || order.fulfillment;
  const origLabel = originLabels[order.origin] || order.origin;
  const pedidoNum =
    order.order_number && String(order.order_number).padStart(6, "0");
  const L = [];
  
  if (pedidoNum) L.push((`PEDIDO #${pedidoNum}`));
  L.push("");
  L.push("");
  L.push(bar);

  L.push(center(`${header}`));
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
        L.push(
          padLine(`  + ${prod?.name || m.modifier.name}`, fmt(subAdd))
        );
      });
    it.modifiers
      .filter((m) => m.type === "removal")
      .forEach((m) => {
        L.push(`  - ${m.modifier.name}`);
      });
  });
  L.push(line());
  L.push(padLine("TOTAL", fmt(total)));
  if (order.notes && order.notes.trim()) {
    L.push("");
    L.push(center("OBSERVAÇÕES"));
    L.push(line());
    order.notes.split("\n").forEach(obs =>
      L.push(obs.length > WIDTH ? obs.match(new RegExp(`.{1,${WIDTH}}`, "g")).join("\n") : obs)
    );
    L.push(line());
  }
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
  L.push("");
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
        title: `Nota Pedido #${data.order.order_number}`,
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
        width: 600,
        background: "#181818",
      }).then((res) => {
        if (res.isConfirmed) {
          const w = window.open("", "_blank", "fullscreen=yes");
          w.document.write(`
<html><head><title>Nota Pedido</title>
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
</head><body><pre>${receiptText}</pre></body></html>`);
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

  const computeTotal = (order) => {
    let sum = 0;
    order.items.forEach((it) => {
      sum += Number(it.subtotal);
      it.modifiers
        .filter((m) => m.type === "addition")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier_id);
          const unit = prod ? Number(prod.price) : 0;
          const count = m.quantity || 1;
          sum += unit * count;
        });
    });
    return sum;
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
        return (
          date >= filters.startDate &&
          date <= filters.endDate &&
          time >= filters.startTime &&
          time <= filters.endTime &&
          (o.customer_name || "")
            .toLowerCase()
            .includes(filters.customer.toLowerCase()) &&
          (filters.item
            ? o.items.some((i) =>
                i.item.name
                  .toLowerCase()
                  .includes(filters.item.toLowerCase())
              )
            : true)
        );
      }),
    [orders, filters]
  );

  if (loading) {
    return (
      <Container className="order-list__container order-list__loading text-center mt-5">
        <Spinner animation="border" className="order-list__spinner" /> Carregando pedidos...
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container className="order-list__container">
        <div className="order-list__header">
          {estLogo && (
            <img
              src={`${storageUrl}/${estLogo}`}
              alt={`${estName} logo`}
              className="order-list__logo"
              onError={(e) => {
                e.currentTarget.src = "/images/logo.png";
              }}
            />
          )}
          <div className="order-list__establishment-name">
            <strong>{estName}</strong>
          </div>
          <Button
            as={Link}
            to={`/order/create/${entityId}`}
            variant="success"
            className="order-list__btn-new"
            size="sm"
          >
            Novo Pedido
          </Button>
        </div>
        <Row className="order-list__filters-row mb-4">
          <Form className="order-list__filters-form">
            <Row className="order-list__filters-row">
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Data Início</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={e =>
                    setFilters((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Data Final</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={e =>
                    setFilters((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Hora Início</Form.Label>
                <Form.Control
                  type="time"
                  value={filters.startTime}
                  onChange={e =>
                    setFilters((f) => ({ ...f, startTime: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Hora Final</Form.Label>
                <Form.Control
                  type="time"
                  value={filters.endTime}
                  onChange={e =>
                    setFilters((f) => ({ ...f, endTime: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Cliente</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nome do cliente"
                  value={filters.customer}
                  onChange={e =>
                    setFilters((f) => ({ ...f, customer: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
              <Col md={2}>
                <Form.Label className="order-list__filters-label">Item</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nome do item"
                  value={filters.item}
                  onChange={e =>
                    setFilters((f) => ({ ...f, item: e.target.value }))
                  }
                  className="order-list__filters-control"
                />
              </Col>
            </Row>
          </Form>
        </Row>
        {/* TABELA DESKTOP */}
        <div className="order-table__responsive d-none d-md-block">
          <Table striped bordered hover responsive className="order-table__table">
            <thead className="order-table__head">
              <tr>
                <th className="order-table__th">#</th>
                <th className="order-table__th">Data/Hora</th>
                <th className="order-table__th">Cliente</th>
                <th className="order-table__th">Origem</th>
                <th className="order-table__th">Consumo</th>
                <th className="order-table__th">Status Pgto</th>
                <th className="order-table__th">Total</th>
                <th className="order-table__th">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="order-table__row align-middle">
                  <td className="order-table__td">{o.order_number}</td>
                  <td className="order-table__td">
                    {new Date(o.order_datetime).toLocaleString("pt-BR", {
                      hour12: false,
                    })}
                  </td>
                  <td className="order-table__td">{o.customer_name}</td>
                  <td className="order-table__td">{originLabels[o.origin]}</td>
                  <td className="order-table__td">{fulfillmentLabels[o.fulfillment]}</td>
                  <td className="order-table__td">{paymentStatusLabels[o.payment_status]}</td>
                  <td className="order-table__td">
                    <Badge bg="info" className="order-table__badge-total">
                      R${computeTotal(o).toFixed(2).replace(".", ",")}
                    </Badge>
                  </td>
                  <td className="order-table__td">
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="warning"
                        as={Link}
                        to={`/order/edit/${entityId}/${o.id}`}
                        className="order-table__btn-edit"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReprint(o.id)}
                        className="order-table__btn-print"
                      >
                        Imprimir Nota
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {/* MOBILE CARDS */}
        <div className="order-list__mobile d-block d-md-none">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="order-list__card mb-3 shadow-sm">
              <Card.Header className="order-list__card-header">
                Pedido #{o.order_number} —{" "}
                {new Date(o.order_datetime).toLocaleString("pt-BR", {
                  hour12: false,
                })}
              </Card.Header>
              <Card.Body className="order-list__card-body">
                <div className="order-list__card-row">Cliente: {o.customer_name}</div>
                <div className="order-list__card-row">Origem: {originLabels[o.origin]}</div>
                <div className="order-list__card-row">Consumo: {fulfillmentLabels[o.fulfillment]}</div>
                <div className="order-list__card-row">
                  Status Pgto: {paymentStatusLabels[o.payment_status]}
                </div>
                <div className="order-list__card-row">
                  Total: <b>R${computeTotal(o).toFixed(2).replace(".", ",")}</b>
                </div>
              </Card.Body>
              <Card.Footer className="order-list__card-footer d-flex justify-content-between">
                <Button
                  as={Link}
                  to={`/order/create/${entityId}`}
                  size="sm"
                  variant="success"
                  className="order-list__btn-new"
                >
                  Novo Pedido
                </Button>
                <div className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="warning"
                    as={Link}
                    to={`/order/edit/${entityId}/${o.id}`}
                    className="order-list__btn-edit"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReprint(o.id)}
                    className="order-list__btn-print"
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

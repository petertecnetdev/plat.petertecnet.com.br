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
    origin: "",
    fulfillment: "",
    payment_method: "",
    payment_status: "",
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

  const paymentMethodLabels = {
    Dinheiro: "Dinheiro",
    Pix: "Pix",
    Crédito: "Crédito",
    Débito: "Débito",
    Fiado: "Fiado",
    Cortesia: "Cortesia",
    "Transferência bancária": "Transferência bancária",
    "Vale-refeição": "Vale-refeição",
    Cheque: "Cheque",
    PayPal: "PayPal",
  };
useEffect(() => {
  let isMounted = true;
  const token = localStorage.getItem("token");

  // Se tiver token, já seta no header default do axios
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  async function loadData() {
    setLoading(true);

    // 1️⃣ buscar pedidos
    let fetchedOrders = [];
    try {
      const res = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
        params: {
          app_id: 3,
          entity_name: "establishment",
          entity_id: entityId,
        },
      });
      fetchedOrders = Array.isArray(res.data.orders) ? res.data.orders : [];
    } catch {
      fetchedOrders = [];
    }

    // 2️⃣ buscar estabelecimento e itens em paralelo
    const [estResult, itemsResult] = await Promise.allSettled([
      axios.get(`${apiBaseUrl}/establishment/show/${entityId}`),
      axios.get(`${apiBaseUrl}/item`, {
        params: { entity_name: "establishment", entity_id: entityId },
      }),
    ]);

    if (estResult.status === "fulfilled") {
      const est = estResult.value.data.establishment;
      if (isMounted) {
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo || "");
      }
    } else {
      Swal.fire(
        "Erro",
        "Não foi possível carregar os dados do estabelecimento.",
        "error"
      );
      if (isMounted) setLoading(false);
      return;
    }

    if (
      itemsResult.status === "fulfilled" &&
      Array.isArray(itemsResult.value.data)
    ) {
      if (isMounted) setProducts(itemsResult.value.data);
    } else {
      if (isMounted) setProducts([]);
    }

    if (isMounted) {
      setOrders(fetchedOrders);
      setLoading(false);
    }
  }

  loadData();

  return () => {
    isMounted = false;
  };
}, [entityId]);



  const computeTotal = (order) => {
    let sum = 0;
    order.items.forEach((it) => {
      sum += Number(it.subtotal);
      it.modifiers
        .filter((m) => m.type === "addition")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier_id);
          sum += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
        });
    });
    return sum;
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const dt = new Date(o.order_datetime);

        // por:
        const date = dt.toLocaleDateString("en-CA", {
          timeZone: "America/Sao_Paulo",
        }); // YYYY‑MM‑DD no horário de SP
        const time = dt.toLocaleTimeString("pt-BR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        }); // HH:MM local

        return (
          date >= filters.startDate &&
          date <= filters.endDate &&
          time >= filters.startTime &&
          time <= filters.endTime &&
          (filters.origin ? o.origin === filters.origin : true) &&
          (filters.fulfillment
            ? o.fulfillment === filters.fulfillment
            : true) &&
          (filters.payment_method
            ? o.payment_method === filters.payment_method
            : true) &&
          (filters.payment_status
            ? o.payment_status === filters.payment_status
            : true) &&
          o.customer_name
            .toLowerCase()
            .includes(filters.customer.toLowerCase()) &&
          (filters.item
            ? o.items.some((i) =>
                i.item.name.toLowerCase().includes(filters.item.toLowerCase())
              )
            : true)
        );
      }),
    [orders, filters]
  );

  const summary = useMemo(() => {
    const totalOrders = filteredOrders.length;
    let totalValue = 0;
    const methods = Object.fromEntries(
      Object.keys(paymentMethodLabels).map((pm) => [pm, { count: 0, total: 0 }])
    );
    methods.Outros = { count: 0, total: 0 };

    filteredOrders.forEach((o) => {
      const val = computeTotal(o);
      totalValue += val;
      const pm = o.payment_method || "Outros";
      if (methods[pm]) {
        methods[pm].count++;
        methods[pm].total += val;
      } else {
        methods.Outros.count++;
        methods.Outros.total += val;
      }
    });
    return { totalOrders, totalValue, methods };
  }, [filteredOrders]);

  const buildReceipt = (order) => {
    const header = estName;
    const WIDTH = Math.max(32, header.length);
    const bar = "█".repeat(WIDTH);
    const line = () => "-".repeat(WIDTH);
    const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - l.length - r.length, 0));
      return `${l}${dots}${r}`;
    };
    const center = (text) =>
      text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);

    const cons = fulfillmentLabels[order.fulfillment] || order.fulfillment;
    const orig = originLabels[order.origin] || order.origin;
    const num = order.order_number
      ? String(order.order_number).padStart(6, "0")
      : null;
    const L = [];

    if (num) L.push(`PEDIDO #${num}`);
    L.push("", bar, center(header), bar, "");
    L.push(`👤 Cliente: ${(order.customer_name || "").toUpperCase()}`);
    L.push(`📦 Origem: ${orig.toUpperCase()}`);
    L.push(`🍽️ Consumo: ${cons.toUpperCase()}`, line());
    L.push(center("ITENS DO PEDIDO"), line());

    let total = 0;
    order.items.forEach((it) => {
      const sub = Number(it.subtotal);
      total += sub;
      L.push(pad(`${it.quantity}x ${it.item.name}`, fmt(sub)));

      it.modifiers
        .filter((m) => m.type === "addition")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier_id);
          const addSub = (prod ? Number(prod.price) : 0) * (m.quantity || 1);
          total += addSub;
          L.push(pad(`  + ${prod?.name}`, fmt(addSub)));
        });

      it.modifiers
        .filter((m) => m.type === "removal")
        .forEach((m) => L.push(`  - ${m.modifier.name}`));
    });

    L.push(line(), pad("TOTAL", fmt(total)));
    if (order.notes?.trim()) {
      L.push("", center("OBSERVAÇÕES"), line());
      order.notes.split("\n").forEach((ln) => {
        if (ln.length > WIDTH) {
          ln.match(new RegExp(`.{1,${WIDTH}}`, "g")).forEach((c) => L.push(c));
        } else {
          L.push(ln);
        }
      });
      L.push(line());
    }
    L.push(
      "",
      `Data: ${new Date(order.order_datetime).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })}`,
      "",
      "",
      ""
    );
    return L.join("\n");
  };

  const handleReprint = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${apiBaseUrl}/order/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txt = buildReceipt(data.order);
      Swal.fire({
        title: `Nota Pedido #${data.order.order_number}`,
        html: `<style>.swal2-html-container{font-family:monospace;white-space:pre;text-align:left;}</style><pre>${txt}</pre>`,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
        cancelButtonText: "Fechar",
        width: 600,
        background: "#181818",
      }).then((res) => {
        if (res.isConfirmed) {
          const w = window.open("", "_blank", "fullscreen=yes");
          w.document.write(
            `<html><head><title>Nota Pedido</title><style>@page{size:80mm;margin:0;}body{margin:0;width:80mm;font-family:monospace;font-size:16px;line-height:2.4;}pre{white-space:pre-wrap;}</style></head><body><pre>${txt}</pre></body></html>`
          );
          w.document.close();
          w.print();
          w.close();
        }
      });
    } catch {
      Swal.fire("Erro", "Não foi possível reimprimir a nota.", "error");
    }
  };

  if (loading) {
    return (
      <Container className="order-list__container order-list__loading text-center mt-5">
        <Spinner animation="border" className="order-list__spinner" />
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
              onError={(e) => (e.currentTarget.src = "/images/logo.png")}
            />
          )}
          <div className="order-list__establishment-name">
            <strong>{estName}</strong>
          </div>
          <Button
            as={Link}
            to={`/order/create/${entityId}`}
            variant="success"
            size="sm"
            className="order-list__btn-new"
          >
            Novo Pedido
          </Button>
        </div>

        <Row className="mb-4 gx-3 gy-2 order-lines__block ">
          <Col xs={6} md={2}>
            <Card bg="dark" text="light" className="text-center h-100">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Total Pedidos</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  {summary.totalOrders}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={2}>
            <Card bg="dark" text="light" className="text-center h-100">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Valor Total</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  R${summary.totalValue.toFixed(2).replace(".", ",")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          {Object.entries(summary.methods)
            .filter(([, m]) => m.count > 0)
            .map(([pm, m]) => (
              <Col key={pm} xs={6} md={2}>
                <Card bg="dark" text="light" className="text-center h-100">
                  <Card.Body className="p-2">
                    <Card.Title className="fs-6">{pm}</Card.Title>
                    <Card.Text className="fs-5 fw-bold">
                      {m.count} | R${m.total.toFixed(2).replace(".", ",")}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>
<Card className="mb-4 order-lines__block bg-dark">
  <Card.Header className="order-lines__title">
    <strong>Filtros</strong>
  </Card.Header>
  <Card.Body className="order-list__filters-form p-3">
    <Form>
      <Row className="gy-2">
        <Col md={2}>
          <Form.Group controlId="startDate" className="order-create__form-group">
            <Form.Label>Data Início</Form.Label>
            <Form.Control
              type="date"
              value={filters.startDate}
              onChange={e =>
                setFilters(f => ({ ...f, startDate: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="endDate" className="order-create__form-group">
            <Form.Label>Data Final</Form.Label>
            <Form.Control
              type="date"
              value={filters.endDate}
              onChange={e =>
                setFilters(f => ({ ...f, endDate: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="startTime" className="order-create__form-group">
            <Form.Label>Hora Início</Form.Label>
            <Form.Control
              type="time"
              value={filters.startTime}
              onChange={e =>
                setFilters(f => ({ ...f, startTime: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="endTime" className="order-create__form-group">
            <Form.Label>Hora Final</Form.Label>
            <Form.Control
              type="time"
              value={filters.endTime}
              onChange={e =>
                setFilters(f => ({ ...f, endTime: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="origin" className="order-create__form-group">
            <Form.Label>Origem</Form.Label>
            <Form.Select
              value={filters.origin}
              onChange={e =>
                setFilters(f => ({ ...f, origin: e.target.value }))
              }
              className="order-create__select"
            >
              <option value="">Todas</option>
              <option value="Balcão">Balcão</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telefone">Telefone</option>
              <option value="App">Aplicativo</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="fulfillment" className="order-create__form-group">
            <Form.Label>Consumo</Form.Label>
            <Form.Select
              value={filters.fulfillment}
              onChange={e =>
                setFilters(f => ({ ...f, fulfillment: e.target.value }))
              }
              className="order-create__select"
            >
              <option value="">Todos</option>
              <option value="dine-in">Local</option>
              <option value="take-away">Levar</option>
              <option value="delivery">Delivery</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="customer" className="order-create__form-group">
            <Form.Label>Cliente</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nome do cliente"
              value={filters.customer}
              onChange={e =>
                setFilters(f => ({ ...f, customer: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="item" className="order-create__form-group">
            <Form.Label>Item</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nome do item"
              value={filters.item}
              onChange={e =>
                setFilters(f => ({ ...f, item: e.target.value }))
              }
              className="order-create__input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="payment_method" className="order-create__form-group">
            <Form.Label>Pagamento</Form.Label>
            <Form.Select
              value={filters.payment_method}
              onChange={e =>
                setFilters(f => ({ ...f, payment_method: e.target.value }))
              }
              className="order-create__select"
            >
              <option value="">Todos</option>
              {Object.keys(paymentMethodLabels).map(pm => (
                <option key={pm} value={pm}>
                  {paymentMethodLabels[pm]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group controlId="payment_status" className="order-create__form-group">
            <Form.Label>Status Pgto</Form.Label>
            <Form.Select
              value={filters.payment_status}
              onChange={e =>
                setFilters(f => ({ ...f, payment_status: e.target.value }))
              }
              className="order-create__select"
            >
              <option value="">Todos</option>
              {Object.keys(paymentStatusLabels).map(ps => (
                <option key={ps} value={ps}>
                  {paymentStatusLabels[ps]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  </Card.Body>
</Card>

        <div className="order-list__table-responsive d-none d-md-block">
          <Table
            striped
            hover
            variant="dark"
            responsive
            className="order-table"
          >
            <thead>
              <tr>
                <th>#</th>
                <th>Data / Hora</th>
                <th>Cliente</th>
                <th>Origem</th>
                <th>Consumo</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.order_number}</td>
                  <td>
                    {new Date(o.order_datetime).toLocaleString("pt-BR", {
                      hour12: false,
                    })}
                  </td>
                  <td>{o.customer_name}</td>
                  <td>{originLabels[o.origin]}</td>
                  <td>{fulfillmentLabels[o.fulfillment]}</td>
                  <td>{paymentMethodLabels[o.payment_method]}</td>
                  <td>{paymentStatusLabels[o.payment_status]}</td>
                  <td>
                    <Badge bg="warning" text="dark">
                      R${computeTotal(o).toFixed(2).replace(".", ",")}
                    </Badge>
                  </td>
                  <td className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-warning"
                      as={Link}
                      to={`/order/edit/${entityId}/${o.id}`}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => handleReprint(o.id)}
                    >
                      Imprimir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <div className="order-list__mobile d-block d-md-none">
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
                <div>Pagamento: {paymentMethodLabels[o.payment_method]}</div>
                <div>Status Pgto: {paymentStatusLabels[o.payment_status]}</div>
                <div>
                  Total: <b>R${computeTotal(o).toFixed(2).replace(".", ",")}</b>
                </div>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button
                  as={Link}
                  to={`/order/create/${entityId}`}
                  size="sm"
                  variant="success"
                >
                  Novo Pedido
                </Button>
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

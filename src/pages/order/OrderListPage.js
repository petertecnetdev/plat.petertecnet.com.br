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
  ButtonGroup,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

function getFirstDayOfLastMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth() - 1, 1);
}
function getLastDayOfLastMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), 0);
}
function getMonday(d) {
  d = new Date(d);
  const day = d.getDay(),
    diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function OrderListPage() {
  const { entityId } = useParams();
  const todayObj = new Date();
  const today = todayObj.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  // Datas auxiliares
  const dt = new Date();
  const ont = new Date(dt);
  ont.setDate(dt.getDate() - 1);
  const ontDate = ont.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const lastMonday = getMonday(
    new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 7)
  );
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  const weekStart = lastMonday.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const weekEnd = lastSunday.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const lastMonthFirst = getFirstDayOfLastMonth(dt);
  const lastMonthLast = getLastDayOfLastMonth(dt);
  const monthStart = lastMonthFirst.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const monthEnd = lastMonthLast.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const thisMonthStartObj = new Date(dt.getFullYear(), dt.getMonth(), 1);
  const thisMonthStart = thisMonthStartObj.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  const thisMonthEnd = today;

  // State
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
  const [quickFilter, setQuickFilter] = useState("hoje");
  const [showForecast, setShowForecast] = useState(false);
  const [forecastOrders, setForecastOrders] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(false);

  // Labels
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

  // Normaliza horários para ISO
  const normalizeTime = (t) => {
    if (!t) return "00:00:00";
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    return "00:00:00";
  };

  // Transforma registro de forecast
  const parseForecast = (f, idx = 0) => {
    let itemsArr = [];
    if (typeof f.items_forecast === "string") {
      try {
        itemsArr = JSON.parse(f.items_forecast);
      } catch {  // falha silenciosa
        }
    } else {
      itemsArr = f.items_forecast || [];
    }

    const datePart = f.forecast_date || "";
    const timePart = f.forecast_time
      ? normalizeTime(f.forecast_time)
      : "00:00:00";
    const iso = datePart ? `${datePart}T${timePart}` : null;

    return {
      ...f,
      id: `forecast-${f.id || idx}`,
      order_number: f.order_number || 1000 + idx,
      order_datetime: iso,
      customer_name: f.customer_name_forecast || "",
      origin: f.origin_forecast || "",
      fulfillment: f.fulfillment_forecast || "",
      items: itemsArr.map((i) => ({
        item: { id: i.item_id, name: i.name, price: i.price },
        quantity: i.quantity || 1,
        subtotal: (i.price || 0) * (i.quantity || 1),
        modifiers: [],
      })),
      payment_method: f.payment_method_forecast || "Dinheiro",
      payment_status: "previsto",
      notes: f.notes_forecast || "",
      total: f.total_forecast || 0,
      forecast: true,
    };
  };

  // Quick filters
  const handleQuickFilter = (mode) => {
    let startDate, endDate;
    switch (mode) {
      case "hoje":
        startDate = endDate = today;
        setShowForecast(false);
        break;
      case "ontem":
        startDate = endDate = ontDate;
        setShowForecast(false);
        break;
      case "previsao":
        startDate = endDate = today;
        setShowForecast(true);
        setLoadingForecast(true);
        (async () => {
          try {
            await axios.post(`${apiBaseUrl}/order-forecast/generate`, {
              entity_id: entityId,
              start_date: today,
              end_date: today,
            });
            setFilters((f) => ({
              ...f,
              startDate,
              endDate,
              startTime: "00:00",
              endTime: "23:59",
            }));
            setQuickFilter(mode);
          } catch {
            Swal.fire("Erro", "Falha ao gerar previsão!", "error");
            setLoadingForecast(false);
          }
        })();
        return;
      case "semanapassada":
        startDate = weekStart;
        endDate = weekEnd;
        setShowForecast(false);
        break;
      case "mespassado":
        startDate = monthStart;
        endDate = monthEnd;
        setShowForecast(false);
        break;
      case "estemes":
        startDate = thisMonthStart;
        endDate = thisMonthEnd;
        setShowForecast(false);
        break;
      default:
        startDate = endDate = today;
        setShowForecast(false);
    }
    setQuickFilter(mode);
    setFilters((f) => ({
      ...f,
      startDate,
      endDate,
      startTime: "00:00",
      endTime: "23:59",
    }));
  };

  // Carrega forecasts
  useEffect(() => {
    if (!showForecast) return;
    setLoadingForecast(true);
    axios
      .get(`${apiBaseUrl}/order-forecast`, {
        params: {
          entity_id: entityId,
          start_date: filters.startDate,
          end_date: filters.endDate,
          status: "pending",
        },
      })
      .then((res) => {
        setForecastOrders(res.data.data || []);
      })
      .catch(() => {
        setForecastOrders([]);
      })
      .finally(() => {
        setLoadingForecast(false);
      });
  }, [showForecast, entityId, filters.startDate, filters.endDate]);

  // Carrega pedidos reais + estabelecimento + itens
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    async function load() {
      setLoading(true);
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
      } catch {// falha silenciosa
        }

      const [estRes, itemRes] = await Promise.allSettled([
        axios.get(`${apiBaseUrl}/establishment/show/${entityId}`),
        axios.get(`${apiBaseUrl}/item`, {
          params: { entity_name: "establishment", entity_id: entityId },
        }),
      ]);

      if (estRes.status === "fulfilled" && mounted) {
        const est = estRes.value.data.establishment;
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo || "");
      }
      if (itemRes.status === "fulfilled" && mounted) {
        setProducts(
          Array.isArray(itemRes.value.data) ? itemRes.value.data : []
        );
      }
      if (mounted) {
        setOrders(fetchedOrders);
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [entityId]);

  const computeTotal = (order) => {
    if (order.forecast) return Number(order.total) || 0;
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

  // Filtra pedidos reais
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const dt = new Date(o.order_datetime);
      const date = dt.toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      });
      const time = dt.toLocaleTimeString("pt-BR", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      return (
        date >= filters.startDate &&
        date <= filters.endDate &&
        time >= filters.startTime &&
        time <= filters.endTime &&
        (filters.origin ? o.origin === filters.origin : true) &&
        (filters.fulfillment ? o.fulfillment === filters.fulfillment : true) &&
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
              i.item.name
                .toLowerCase()
                .includes(filters.item.toLowerCase())
            )
          : true)
      );
    });
  }, [orders, filters]);

  const ordersToShow = showForecast
    ? forecastOrders.map(parseForecast)
    : filteredOrders;

  const summary = useMemo(() => {
    const totalOrders = ordersToShow.length;
    let totalValue = 0;
    const methods = Object.fromEntries(
      Object.keys(paymentMethodLabels).map((pm) => [pm, { count: 0, total: 0 }])
    );
    methods.Outros = { count: 0, total: 0 };
    ordersToShow.forEach((o) => {
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
  }, [ordersToShow]);

  // Reimprime usando o receipt vindo da API
const handleReprint = async (id) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/order/${id}`);
    Swal.fire({
      title: `Pedido #${data.order.order_number}`,
      html: `
        <style>.swal2-html-container{font-family:monospace;white-space:pre;text-align:left;}</style>
        <pre id="receipt-content">${data.receipt}</pre>
        <button id="btn-print-receipt" style="
          margin-top:16px;
          padding:6px 18px;
          background:#D4AF37;
          color:#181818;
          border:none;
          border-radius:6px;
          font-weight:bold;
          font-size:1rem;
          cursor:pointer;
        ">
          Imprimir Nota
        </button>
      `,
      width: 600,
      background: "#181818",
      confirmButtonText: "Fechar",
      didOpen: () => {
        document
          .getElementById('btn-print-receipt')
          .addEventListener('click', () => {
            const printContents = document.getElementById('receipt-content').innerText;
            const printWindow = window.open('', '', 'height=700,width=400');
            printWindow.document.write(`
              <html>
                <head>
                  <title>Recibo</title>
                  <style>
                    body { font-family: monospace; background: #fff; color: #000; padding: 24px; }
                    pre { font-size: 1.12rem; }
                  </style>
                </head>
                <body>
                  <pre>${printContents}</pre>
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 400);
          });
      },
    });
  } catch {
    Swal.fire("Erro", "Não foi possível reimprimir a nota.", "error");
  }
};

  if (loading || (showForecast && loadingForecast)) {
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
        {/* ---------- HEADER ---------- */}
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

        {/* ---------- QUICK FILTERS ---------- */}
        <Row className="mb-3">
          <Col>
            <ButtonGroup className="order-list__quickfilter-group flex-wrap">
              {[
                ["ontem", "Ontem"],
                ["hoje", "Hoje"],
                ["previsao", "Previsão do Dia"],
                ["semanapassada", "Semana Passada"],
                ["mespassado", "Mês Passado"],
                ["estemes", "Este Mês"],
              ].map(([mode, label]) => (
                <Button
                  key={mode}
                  variant={quickFilter === mode ? "warning" : "dark"}
                  size="sm"
                  onClick={() => handleQuickFilter(mode)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </Col>
        </Row>

        {/* ---------- SUMMARY CARDS ---------- */}
        <Row className="mb-4 gx-3 gy-2 order-lines__block">
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

        {/* ---------- FILTER FORM (pode customizar) ---------- */}
        <Card className="mb-4 order-lines__block bg-dark">
          <Card.Header className="order-lines__title">
            <strong>Filtros</strong>
          </Card.Header>
          <Card.Body className="order-list__filters-form p-3">
            <Form>
              {/* implementar os inputs de filtro aqui */}
            </Form>
          </Card.Body>
        </Card>

        {/* ---------- TABLE DESKTOP ---------- */}
        <div className="order-list__table-responsive d-none d-md-block">
       <Table striped hover variant="dark" responsive className="order-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Data / Hora</th>
      <th>Cliente</th>
      <th>Origem</th>
      <th>Consumo</th>
      <th>Status Pagamento</th>
      <th>Método Pagamento</th>
      <th>Itens</th>
      <th>Total</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    {ordersToShow.length === 0 ? (
      <tr>
        <td colSpan={10} className="text-center py-5">
          {showForecast
            ? "Nenhuma previsão cadastrada para o dia."
            : "Nenhum pedido encontrado para o período selecionado."}
        </td>
      </tr>
    ) : (
      ordersToShow.map((o) => (
        <tr
          key={o.id}
          className={o.forecast ? "order-row-forecast" : ""}
          style={
            o.forecast
              ? {
                  background: "#22231f",
                  borderLeft: "4px solid #fd7e14",
                  fontWeight: 500,
                }
              : {}
          }
        >
          <td>
            {o.order_number}
            {o.forecast && (
              <span
                style={{
                  color: "#fd7e14",
                  fontWeight: 700,
                  fontSize: 14,
                  marginLeft: 4,
                }}
              >
                🔮
              </span>
            )}
          </td>
          <td>
            {o.forecast
              ? `${o.forecast_date
                  .split("-")
                  .reverse()
                  .join("/")} ${o.forecast_time}`
              : new Date(o.order_datetime).toLocaleString("pt-BR", {
                  hour12: false,
                })}
            {o.forecast && (
              <span
                style={{
                  color: "#fd7e14",
                  fontWeight: 500,
                  marginLeft: 6,
                }}
              >
                Previsão
              </span>
            )}
          </td>
          <td>{o.customer_name}</td>
          <td>{originLabels[o.origin] || o.origin}</td>
          <td>{fulfillmentLabels[o.fulfillment] || o.fulfillment}</td>
          <td>
            {o.payment_status === "pending"
              ? "Pendente"
              : o.payment_status === "paid"
              ? "Pago"
              : o.payment_status === "previsto"
              ? "Previsto"
              : o.payment_status || "-"}
          </td>
          <td>{paymentMethodLabels[o.payment_method] || o.payment_method}</td>
          <td>
            {o.items
              .map(
                (it) =>
                  `${it.quantity}x ${it.item.name
                    .replace("(Combo)", "")
                    .trim()}`
              )
              .join(", ")}
          </td>
          <td>
            <Badge bg="warning" text="dark">
              R${computeTotal(o).toFixed(2).replace(".", ",")}
            </Badge>
          </td>
       <td className="order-table__actions">
  <div className="d-flex gap-2 align-items-center justify-content-end">
    <Button
      size="sm"
      variant="outline-warning"
      as={Link}
      to={`/order/edit/${entityId}/${o.id}`}
      disabled={o.forecast}
    >
      Editar
    </Button>
    <Button
      size="sm"
      variant="outline-secondary"
      onClick={() => handleReprint(o.id)}
      disabled={o.forecast}
    >
      Imprimir
    </Button>
  </div>
</td>


        </tr>
      ))
    )}
  </tbody>
</Table>


        </div>

        {/* ---------- MOBILE ---------- */}
        <div className="order-list__mobile d-block d-md-none">
          {ordersToShow.map((o) => (
            <Card
              key={o.id}
              className={`mb-3 shadow-sm ${
                o.forecast ? "order-row-forecast" : ""
              }`}
              style={
                o.forecast
                  ? {
                      background: "#22231f",
                      borderLeft: "4px solid #fd7e14",
                      fontWeight: 500,
                    }
                  : {}
              }
            >
              <Card.Header>
                Pedido #{o.order_number} —{" "}
                {o.forecast ? (
                  o.forecast_date
                    ? o.forecast_date.split("-").reverse().join("/") +
                      " " +
                      (o.forecast_time || "00:00")
                    : "-"
                ) : (
                  new Date(o.order_datetime).toLocaleString("pt-BR", {
                    hour12: false,
                  })
                )}
                {o.forecast && (
                  <span style={{ color: "#fd7e14", marginLeft: 8 }}>
                    🔮 Previsão
                  </span>
                )}
              </Card.Header>
              <Card.Body>
                <div>Cliente: {o.customer_name}</div>
                <div>Origem: {originLabels[o.origin]}</div>
                <div>Consumo: {fulfillmentLabels[o.fulfillment]}</div>
                <div>
                  Itens:{" "}
                  {o.items
                    .map(
                      (it) =>
                        `${it.quantity}x ${it.item.name
                          .replace("(Combo)", "")
                          .trim()}`
                    )
                    .join(", ")}
                </div>
                <div>
                  Total:{" "}
                  <b>R${computeTotal(o).toFixed(2).replace(".", ",")}</b>
                </div>
              </Card.Body>
              {!o.forecast && (
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
              )}
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}

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
  const n = new Date(d);
  const day = n.getDay();
  const diff = n.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(n.setDate(diff));
}

export default function OrderListPage() {
  const { entityId } = useParams();
  const todayObj = new Date();
  const today = todayObj.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

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

  const originLabels = {
    Balcão: "Balcão",
    WhatsApp: "WhatsApp",
    Telefone: "Telefone",
    App: "Aplicativo",
  };
  const fulfillmentLabels = {
    "dine-in": "LOCAL",
    "take-away": "LEVAR",
    delivery: "DELIVERY",
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

  const normalizeTime = (t) => {
    if (!t) return "00:00:00";
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    return "00:00:00";
  };

  const parseForecast = (f, idx = 0) => {
    let itemsArr = [];
    if (typeof f.items_forecast === "string") {
      try {
        itemsArr = JSON.parse(f.items_forecast);
      } catch (e) {
        itemsArr = [];
      }
    } else {
      itemsArr = f.items_forecast || [];
    }
    const datePart = f.forecast_date || "";
    const timePart = f.forecast_time ? normalizeTime(f.forecast_time) : "00:00:00";
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

  const handleQuickFilter = (mode) => {
    let startDate;
    let endDate;
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
          } catch (e) {
            setLoadingForecast(false);
            Swal.fire("Erro", "Falha ao gerar previsão!", "error");
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

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
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
      } catch (e) {
        fetchedOrders = [];
      }
      const [estRes, itemRes] = await Promise.allSettled([
        axios.get(`${apiBaseUrl}/establishment/show/${entityId}`),
        axios.get(`${apiBaseUrl}/item`, {
          params: { entity_name: "establishment", entity_id: entityId },
        }),
      ]);
      if (estRes.status === "fulfilled" && mounted) {
        const est = estRes.value.data.establishment;
        setEstName((est.name || "").toUpperCase());
        setEstLogo(est.logo || "");
      }
      if (itemRes.status === "fulfilled" && mounted) {
        setProducts(Array.isArray(itemRes.value.data) ? itemRes.value.data : []);
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

  // ===== Helpers e cálculos (padrão Create/Edit) =====
  const money = (n) => `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;

  const ADD_TYPES = new Set(["addition", "combo", "extra", "adicional", "upgrade"]);

  const findProductById = (id) => products.find((p) => p.id === id);

  const getModifierDisplayName = (m) => {
    const byId = findProductById(m.modifier_id);
    const viaItem = m.item?.name;
    const raw = m.name;
    return String(raw || viaItem || byId?.name || "Adicional").trim();
  };

  const getModifierUnitPrice = (m) => {
    const direct = Number(m.price ?? 0);
    if (!Number.isNaN(direct) && direct > 0) return direct;
    const viaItem = Number(m.item?.price ?? 0);
    if (!Number.isNaN(viaItem) && viaItem > 0) return viaItem;
    const byId = findProductById(m.modifier_id);
    if (byId) return Number(byId.price || 0);
    return 0;
  };

  const calcItemLine = (it) => {
    const qty = Number(it.quantity || 1);
    const baseUnit = Number(it.item?.price ?? it.price ?? 0);
    const modifiers = Array.isArray(it.modifiers) ? it.modifiers : [];
    const additions = modifiers.filter((m) =>
      ADD_TYPES.has(String(m.type || "").toLowerCase().trim())
    );
    const addPerUnit = additions.reduce((acc, m) => {
      const unit = getModifierUnitPrice(m);
      const qpu = Number(m.quantity || 1);
      return acc + unit * qpu;
    }, 0);
    const lineSubtotal = qty * (baseUnit + addPerUnit);
    return { qty, additions, lineSubtotal };
  };

  const mapPaymentStatus = (raw) => {
    const s = String(raw || "").toLowerCase().trim();
    if (["pending", "pedding"].includes(s)) return "Pendente";
    if (s === "paid") return "Pago";
    if (s === "previsto") return "Previsto";
    if (s === "canceled" || s === "cancelled") return "Cancelado";
    if (s === "refunded") return "Estornado";
    if (s === "failed") return "Falhou";
    if (s === "partial") return "Parcial";
    return raw || "-";
  };

  const computeTotal = (order) => {
    if (order.forecast) return Number(order.total) || 0;
    const arr = Array.isArray(order.items) ? order.items : [];
    return arr.reduce((acc, it) => acc + calcItemLine(it).lineSubtotal, 0);
  };

  // ===== Impressão (HTML) e Texto para copiar (padrão Create/Edit) =====
  const buildTicketHtml = (order, estNameFromState) => {
    const PAPER_MM = 80;
    const CONTENT_MM = 70;
    const FONT_PT = 18;
    const BIG_PT = 28;
    const mapFulfillment = { "dine-in": "LOCAL", "take-away": "LEVAR", delivery: "DELIVERY" };
    const mapOrigin = { Balcão: "Balcão", WhatsApp: "WhatsApp", Telefone: "Telefone", App: "Aplicativo" };
    const numero = String(order.order_number || "").padStart(4, "0");
    const dataHora = order.order_datetime
      ? new Date(order.order_datetime).toLocaleString("pt-BR", { hour12: false })
      : new Date().toLocaleString("pt-BR", { hour12: false });
    const cliente = order.customer_name || "-";
    const origem = mapOrigin[order.origin] || order.origin || "-";
    const consumo = mapFulfillment[order.fulfillment] || order.fulfillment || "-";
    const metodo = order.payment_method || "-";
    const statusPag = mapPaymentStatus(order.payment_status);
    const obs = order.notes || "";
    const access = order.access_code || "";
    const estab = estNameFromState || order.establishment_name || "";
    const items = Array.isArray(order.items) ? order.items : [];

    const itemRows = items.map((it, idx) => {
      const name = (it.item?.name || it.name || "").replace("(Combo)", "").trim();
      const { qty, additions, lineSubtotal } = calcItemLine(it);
      const addRows = additions.map((m) => {
        const mName = getModifierDisplayName(m);
        const unit = getModifierUnitPrice(m);
        const qpu = Number(m.quantity || 1);
        const totalAdd = unit * qpu * qty;
        return `
          <div class="row leader add">
            <div class="l">+ ${mName} x${qpu} (cada)</div>
            <div class="r">${money(totalAdd)}</div>
          </div>
        `;
      }).join("");

      const removalRows = (Array.isArray(it.modifiers) ? it.modifiers : [])
        .filter((m) => String(m.type || "").toLowerCase().trim() === "removal")
        .map((m) => {
          const mName = getModifierDisplayName(m);
          return `
            <div class="row sub note">
              <div class="l">- sem ${mName}</div>
              <div class="r"></div>
            </div>
          `;
        }).join("");

      return `
        <div class="row leader item">
          <div class="l">#${idx + 1} · x${qty} ${name}</div>
          <div class="r">${money(lineSubtotal)}</div>
        </div>
        ${addRows}
        ${removalRows}
      `;
    }).join("");

    const grandTotal = items.reduce((acc, it) => acc + calcItemLine(it).lineSubtotal, 0);

    return `
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <title>Recibo</title>
          <style>
            @page { size: ${PAPER_MM}mm auto; margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; width: ${PAPER_MM}mm; }
            .wrap { width: ${CONTENT_MM}mm; margin: 0 auto; padding: 8px 0 10px; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; color:#000; }
            .center { text-align: center; }
            .sep { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
            .leader .l { display: flex; align-items: baseline; gap: 6px; }
            .leader .l::after { content: ""; flex: 1 1 auto; border-bottom: 1px dotted #000; margin: 0 6px; transform: translateY(-2px); }
            .l { flex: 1 1 auto; word-break: break-word; }
            .r { flex: 0 0 auto; white-space: nowrap; text-align: right; }
            .bigcode { font-weight: 800; font-size: ${BIG_PT}px; letter-spacing: 1px; padding: 6px 8px; background: #e5e5e5; border-radius: 4px; }
            .label { font-weight: 600; }
            .item { padding: 2px 0; }
            .add { padding: 1px 0 2px 12px; }
            .sub { padding: 0 0 2px 12px; }
            .note .l { font-style: italic; opacity: 0.9; }
            .total { font-weight: 800; }
            .small { font-size: ${FONT_PT - 2}px; }
            .base { font-size: ${FONT_PT}px; line-height: 1.35; }
            @media print { html, body { width:${PAPER_MM}mm } .wrap { width:${CONTENT_MM}mm } }
          </style>
        </head>
        <body>
          <div class="wrap base">
            ${estab ? `<div class="center small">${estab}</div>` : ""}
            <div class="center small">EXPEDIÇÃO</div>
            <div class="center" style="margin:6px 0 8px;"><span class="bigcode">${numero}</span></div>
            ${access ? `<div class="row"><div class="l"><span class="label">Código</span></div><div class="r">${access}</div></div>` : ""}

            <div class="sep"></div>
            <div class="row"><div class="l"><span class="label">Data</span></div><div class="r">${dataHora}</div></div>
            <div class="row"><div class="l"><span class="label">Cliente</span></div><div class="r">${cliente}</div></div>
            <div class="row"><div class="l"><span class="label">Origem</span></div><div class="r">${origem}</div></div>
            <div class="row"><div class="l"><span class="label">Consumo</span></div><div class="r">${consumo}</div></div>

            <div class="sep"></div>
            <div class="center"><span class="label">ITENS DO PEDIDO (${items.length})</span></div>
            ${itemRows}

            <div class="sep"></div>
            <div class="row"><div class="l"><span class="label">Pagamento</span></div><div class="r">${metodo}</div></div>
            <div class="row"><div class="l"><span class="label">Status</span></div><div class="r">${statusPag}</div></div>
            ${obs ? `<div class="sep"></div><div><span class="label">Obs.:</span> ${obs}</div>` : ""}

            <div class="sep"></div>
            <div class="row total leader"><div class="l">Total</div><div class="r">${money(grandTotal)}</div></div>
          </div>
          <script>
            window.onload = function () {
              setTimeout(function(){ window.print(); }, 120);
              setTimeout(function(){ window.close(); }, 420);
            };
          </script>
        </body>
      </html>
    `;
  };

  const buildReceiptText = (order, estNameFromState, originLabelsMap, fulfillmentLabelsMap) => {
    const WIDTH = 32;
    const center = (text) => text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);
    const line = (char = "-") => char.repeat(WIDTH);
    const fmt = (v) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };
    const consLabel = fulfillmentLabelsMap[order.fulfillment] || order.fulfillment || "";
    const origLabel = originLabelsMap[order.origin] || order.origin || "";
    const L = [];
    L.push("");
    L.push("─".repeat(WIDTH));
    L.push(center(estNameFromState || order.establishment_name || ""));
    L.push("─".repeat(WIDTH));
    L.push("");
    L.push(`Cliente: ${(order.customer_name || "").toUpperCase()}`);
    L.push(`Origem: ${String(origLabel || "").toUpperCase()}`);
    L.push(`Consumo: ${String(consLabel || "").toUpperCase()}`);
    L.push(line());
    L.push(center("ITENS DO PEDIDO"));
    L.push(line());

    let totalRec = 0;
    (order.items || []).forEach((it, idx) => {
      const name = (it.item?.name || it.name || "").replace("(Combo)", "").trim();
      const { qty, additions, lineSubtotal } = calcItemLine(it);
      totalRec += lineSubtotal;
      L.push(pad(`#${idx + 1} · ${qty}x ${name}`, fmt(lineSubtotal)));
      additions.forEach((m) => {
        const addUnit = getModifierUnitPrice(m);
        const addQty = Number(m.quantity || 1);
        const addSub = addUnit * addQty * qty;
        L.push(pad(`  + ${addQty}x ${getModifierDisplayName(m)} (cada)`, fmt(addSub)));
      });
      (Array.isArray(it.modifiers) ? it.modifiers : [])
        .filter((m) => String(m.type || "").toLowerCase().trim() === "removal")
        .forEach((m) => {
          L.push(`  - sem ${getModifierDisplayName(m)}`);
        });
    });

    L.push(line());
    L.push(pad("TOTAL", fmt(totalRec)));
    L.push("");
    const d = order.order_datetime ? new Date(order.order_datetime) : new Date();
    L.push(`Data: ${d.toLocaleString("pt-BR", { hour12: false })}`);
    L.push("");
    L.push("");
    return L.join("\n");
  };

  // ===== SweetAlert Reprint (Imprimir + Copiar) =====
  const handleReprint = async (id) => {
  try {
    const { data } = await axios.get(`${apiBaseUrl}/order/${id}`);
    const o = data.order || {};

    const receiptTextRaw = buildReceiptText(o, estName, originLabels, fulfillmentLabels);
    const receiptText = receiptTextRaw.replace(/#\d+\s*[·-]?\s*/g, "");

    await Swal.fire({
      title: `Recibo Pedido #${o.order_number}`,
      html: `<pre style="text-align:left;white-space:pre-wrap;margin:0">${receiptText}</pre>`,
      showCancelButton: true,
      cancelButtonText: "Fechar",
      showDenyButton: true,
      confirmButtonText: "Imprimir",
      denyButtonText: "Copiar",
      width: "800px",
      background: "#0b0b0b",
      color: "#fff",
      customClass: {
        popup: "order-modal__swal-centered",
        confirmButton: "order-modal__swal-btn",
        denyButton: "order-modal__swal-btn-secondary",
        cancelButton: "order-modal__swal-btn-cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const htmlRaw = buildTicketHtml(o, estName);
        const html = htmlRaw.replace(/#\d+\s*·\s*/g, "");
        const w = window.open("", "", "width=520,height=800");
        w.document.write(html);
        w.document.close();
        w.focus();
      } else if (result.isDenied) {
        navigator.clipboard
          .writeText(receiptText)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Copiado!",
              text: "O recibo foi copiado para a área de transferência.",
              confirmButtonText: "OK",
              background: "#0b0b0b",
              color: "#fff",
              customClass: { confirmButton: "order-modal__swal-btn" },
            });
          })
          .catch(() => {
            Swal.fire({
              icon: "error",
              title: "Falha ao copiar",
              text: "Não foi possível copiar o recibo.",
              confirmButtonText: "OK",
              background: "#0b0b0b",
              color: "#fff",
              customClass: { confirmButton: "order-modal__swal-btn" },
            });
          });
      }
    });
  } catch (e) {
    Swal.fire("Erro", "Não foi possível reimprimir a nota.", "error");
  }
};

  // ===== Filtros / lista =====
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const dtt = new Date(o.order_datetime);
      const date = dtt.toLocaleDateString("en-CA", {
        timeZone: "America/Sao_Paulo",
      });
      const time = dtt.toLocaleTimeString("pt-BR", {
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
        (filters.payment_method ? o.payment_method === filters.payment_method : true) &&
        (filters.payment_status ? o.payment_status === filters.payment_status : true) &&
        String(o.customer_name || "")
          .toLowerCase()
          .includes(String(filters.customer || "").toLowerCase()) &&
        (filters.item
          ? o.items.some((i) =>
              String(i.item?.name || i.name || "")
                .toLowerCase()
                .includes(String(filters.item).toLowerCase())
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
        methods[pm].count += 1;
        methods[pm].total += val;
      } else {
        methods.Outros.count += 1;
        methods.Outros.total += val;
      }
    });
    return { totalOrders, totalValue, methods };
  }, [ordersToShow]);

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
            size="sm"
            className="order-list__btn-new"
          >
            Novo Pedido
          </Button>
        </div>

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
                  {money(summary.totalValue)}
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
                      {m.count} | {money(m.total)}
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
            <Form />
          </Card.Body>
        </Card>

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
                    <td>
                      {paymentMethodLabels[o.payment_method] || o.payment_method}
                    </td>
                    <td>
                      {o.items
                        .map((it) => {
                          const base = String(it.item?.name || it.name || "")
                            .replace("(Combo)", "")
                            .trim();
                          const additions = (Array.isArray(it.modifiers)
                            ? it.modifiers
                            : []
                          )
                            .filter((m) =>
                              ADD_TYPES.has(
                                String(m.type || "").toLowerCase().trim()
                              )
                            )
                            .map((m) => getModifierDisplayName(m));
                          return `${it.quantity}x ${base}${
                            additions.length ? " (+" + additions.join(", ") + ")" : ""
                          }`;
                        })
                        .join(", ")}
                    </td>
                    <td>
                      <Badge bg="warning" text="dark">
                        {money(computeTotal(o))}
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
                          Nota
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

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
                    ? `${o.forecast_date.split("-").reverse().join("/")} ${
                        o.forecast_time || "00:00"
                      }`
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
                <div>Origem: {originLabels[o.origin] || o.origin}</div>
                <div>Consumo: {fulfillmentLabels[o.fulfillment] || o.fulfillment}</div>
                <div>
                  Itens:{" "}
                  {o.items
                    .map((it) => {
                      const base = String(it.item?.name || it.name || "")
                        .replace("(Combo)", "")
                        .trim();
                      const additions = (Array.isArray(it.modifiers)
                        ? it.modifiers
                        : []
                      )
                        .filter((m) =>
                          ADD_TYPES.has(
                            String(m.type || "").toLowerCase().trim()
                          )
                        )
                        .map((m) => getModifierDisplayName(m));
                      return `${it.quantity}x ${base}${
                        additions.length ? " (+" + additions.join(", ") + ")" : ""
                      }`;
                    })
                    .join(", ")}
                </div>
                <div>
                  Total: <b>{money(computeTotal(o))}</b>
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
                      Nota
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

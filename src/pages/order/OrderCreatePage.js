import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner, Badge } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

export default function OrderCreatePage() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    origin: "Balcão",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: "",
  });
  const [orderLines, setOrderLines] = useState([]);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const [resItems, resEst] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(Array.isArray(resItems.data) ? resItems.data : []);
        const est = resEst.data.establishment || {};
        setEstName(String(est.name || "").toUpperCase());
        setEstLogo(est.logo || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const total = useMemo(() => {
    let t = 0;
    orderLines.forEach((line) => {
      t += Number(line.quantity || 1) * Number(line.product.price || 0);
      line.additions.forEach((a) => {
        const prod = products.find((p) => p.id === a.id);
        if (prod) t += Number(prod.price || 0) * Number(a.quantity || 1);
      });
    });
    return t;
  }, [orderLines, products]);

  const formattedTotal = `R$ ${total.toFixed(2).replace(".", ",")}`;

  const getItemsHtml = (category) => {
    const items = products.filter((p) => (p.category || "Outros") === category);
    if (!items.length) {
      return '<div class="order-modal__empty">Nenhum item nesta categoria.</div>';
    }
    return items
      .map(
        (p) => `
   <div class="col-12 col-sm-6 col-md-3 mb-3">
      <div class="order-modal__item">
        <div class="order-modal__item-info">
          <span class="order-modal__item-name">${p.name}</span>
          <span class="order-modal__item-price">
            R$ ${Number(p.price).toFixed(2).replace(".", ",")}
          </span>
        </div>
        <button class="order-modal__item-add" data-id="${p.id}">
          Adicionar
        </button>
      </div>
    </div>
  `
      )
      .join("");
  };

  const handleAddItem = async () => {
    const categories = Array.from(new Set(products.map((p) => p.category || "Outros")));
    let currentIndex = 0;
    let lastDirection = null;
    const getHtml = () => {
      const isMobile = window.innerWidth <= 600;
      const currentCat = categories[currentIndex];
      const transitionClass =
        lastDirection === "left"
          ? "order-modal__slide-left"
          : lastDirection === "right"
          ? "order-modal__slide-right"
          : "";
      return `
        <div class="order-modal d-flex flex-column h-100">
          ${
            isMobile
              ? `<div class="order-modal__category-title">${currentCat}</div>`
              : `
                <nav class="order-modal__tabs">
                  ${categories
                    .map(
                      (cat, idx) => `
                        <button
                          class="order-modal__tab${idx === currentIndex ? " order-modal__tab--active" : ""}"
                          data-cat-index="${idx}"
                        >${cat}</button>
                      `
                    )
                    .join("")}
                </nav>
              `
          }
          <div class="container-fluid flex-grow-1 overflow-auto p-3">
            <div class="row order-modal__items-grid ${transitionClass}">
              ${getItemsHtml(currentCat)}
            </div>
          </div>
          <div class="order-modal__footer">
            <button class="order-modal__swal-btn-cancel" data-close="1">Cancelar</button>
          </div>
        </div>
      `;
    };
    await Swal.fire({
      html: getHtml(),
      showConfirmButton: false,
      showCancelButton: false,
      width: "100vw",
      heightAuto: false,
      background: "#000",
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
      },
      didOpen: () => {
        let startX = 0;
        let isTouching = false;
        const attachListeners = () => {
          const root = Swal.getHtmlContainer();
          const grid = root.querySelector(".order-modal__items-grid");
          if (grid) {
            grid.addEventListener("touchstart", (e) => {
              isTouching = true;
              startX = e.touches[0].clientX;
            });
            grid.addEventListener("touchend", (e) => {
              if (!isTouching) return;
              isTouching = false;
              const diff = e.changedTouches[0].clientX - startX;
              if (Math.abs(diff) < 40) return;
              if (diff < 0 && currentIndex < categories.length - 1) {
                lastDirection = "left";
                currentIndex += 1;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff > 0 && currentIndex > 0) {
                lastDirection = "right";
                currentIndex -= 1;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff < 0 && currentIndex === categories.length - 1) {
                lastDirection = "left";
                currentIndex = 0;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              } else if (diff > 0 && currentIndex === 0) {
                lastDirection = "right";
                currentIndex = categories.length - 1;
                Swal.update({ html: getHtml() });
                setTimeout(attachListeners, 180);
              }
            });
          }
          root.querySelectorAll(".order-modal__tab").forEach((btn) => {
            btn.onclick = () => {
              lastDirection = null;
              currentIndex = Number(btn.dataset.catIndex);
              Swal.update({ html: getHtml() });
              setTimeout(attachListeners, 120);
            };
          });
          root.querySelectorAll(".order-modal__item-add").forEach((btn) => {
            btn.onclick = (e) => {
              const id = Number(e.currentTarget.dataset.id);
              const prod = products.find((p) => p.id === id);
              if (!prod) return;
              setOrderLines((lines) => [
                ...lines,
                { product: prod, quantity: 1, additions: [], removals: [] },
              ]);
              Swal.close();
            };
          });
          root.querySelector('[data-close="1"]')?.addEventListener("click", () => Swal.close());
        };
        attachListeners();
      },
    });
  };

  const handleManage = async (index, type) => {
    const additionsProducts = products.filter((p) => (p.category || "").toLowerCase() === "adicionais");
    const orderLine = orderLines[index];
    const selectedAdds = new Map(orderLine.additions.map((a) => [a.id, a.quantity]));
    const selectedRems = new Set(orderLine.removals);

    const buildAdditionsGrid = () => {
      if (!additionsProducts.length)
        return '<div class="order-modal__empty">Nenhum adicional cadastrado.</div>';
      return `
        <div class="container-fluid flex-grow-1 overflow-auto p-3">
          <div class="row order-modal__items-grid">
            ${additionsProducts
              .map((p) => {
                const qty = selectedAdds.get(p.id) || 0;
                return `
                  <div class="col-12 col-sm-6 col-md-3 mb-3">
                    <div class="order-modal__item">
                      <div class="order-modal__item-info">
                        <span class="order-modal__item-name">${p.name}</span>
                        <span class="order-modal__item-price">R$ ${Number(p.price).toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div class="order-modal__qty">
                        <button class="order-modal__qty-btn" data-act="dec" data-id="${p.id}">−</button>
                        <span class="order-modal__qty-val" data-id="${p.id}">${qty}</span>
                        <button class="order-modal__qty-btn" data-act="inc" data-id="${p.id}">+</button>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <div class="order-modal__footer">
          <button class="order-modal__swal-btn-cancel" data-close="1">Cancelar</button>
          <button class="order-modal__swal-btn" data-save="1">Salvar</button>
        </div>
      `;
    };

    const buildRemovalsGrid = () => {
      if (!additionsProducts.length)
        return '<div class="order-modal__empty">Nenhum item removível cadastrado.</div>';
      return `
        <div class="container-fluid flex-grow-1 overflow-auto p-3">
          <div class="row order-modal__items-grid">
            ${additionsProducts
              .map((p) => {
                const on = selectedRems.has(p.id);
                return `
                  <div class="col-12 col-sm-6 col-md-3 mb-3">
                    <div class="order-modal__item">
                      <div class="order-modal__item-info">
                        <span class="order-modal__item-name">${p.name}</span>
                        <span class="order-modal__item-price">&nbsp;</span>
                      </div>
                      <button class="order-modal__toggle${on ? " is-on" : ""}" data-id="${p.id}">
                        ${on ? "Remover ✓" : "Remover"}
                      </button>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>
        <div class="order-modal__footer">
          <button class="order-modal__swal-btn-cancel" data-close="1">Cancelar</button>
          <button class="order-modal__swal-btn" data-save="1">Salvar</button>
        </div>
      `;
    };

    const modalHtml = `
      <div class="order-modal d-flex flex-column h-100">
        <div class="order-modal__category-title">${type === "additions" ? "Adicionais" : "Remoções"}</div>
        ${type === "additions" ? buildAdditionsGrid() : buildRemovalsGrid()}
      </div>
      <style>
        .order-modal__qty{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:8px}
        .order-modal__qty-btn{background:#111;border:1px solid #333;color:#fff;border-radius:8px;width:36px;height:32px}
        .order-modal__qty-val{min-width:24px;text-align:center;font-weight:700}
        .order-modal__toggle{background:#111;border:1px solid #333;color:#fff;border-radius:10px;padding:8px 10px}
        .order-modal__toggle.is-on{border-color:#0f0}
        .order-modal__footer{display:flex;justify-content:space-between;gap:12px;padding:10px;border-top:1px solid #222;background:#000}
      </style>
    `;

    await Swal.fire({
      html: modalHtml,
      showConfirmButton: false,
      showCancelButton: false,
      width: "100vw",
      heightAuto: false,
      background: "#000",
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
      },
      didOpen: () => {
        const root = Swal.getHtmlContainer();
        const onQtyClick = (e) => {
          const btn = e.target.closest(".order-modal__qty-btn");
          if (!btn) return;
          const id = Number(btn.dataset.id);
          const act = btn.dataset.act;
          const curr = selectedAdds.get(id) || 0;
          const next = Math.max(0, curr + (act === "inc" ? 1 : -1));
          if (next === 0) selectedAdds.delete(id);
          else selectedAdds.set(id, next);
          const valEl = root.querySelector(`.order-modal__qty-val[data-id="${id}"]`);
          if (valEl) valEl.textContent = String(next);
        };
        const onToggleClick = (e) => {
          const btn = e.target.closest(".order-modal__toggle");
          if (!btn) return;
          const id = Number(btn.dataset.id);
          if (selectedRems.has(id)) selectedRems.delete(id);
          else selectedRems.add(id);
          btn.classList.toggle("is-on");
          btn.textContent = btn.classList.contains("is-on") ? "Remover ✓" : "Remover";
        };
        root.addEventListener("click", onQtyClick);
        root.addEventListener("click", onToggleClick);
        root.querySelector('[data-close="1"]')?.addEventListener("click", () => Swal.close());
        root.querySelector('[data-save="1"]')?.addEventListener("click", () => {
          if (type === "additions") {
            const arr = Array.from(selectedAdds.entries()).map(([id, quantity]) => ({ id, quantity }));
            setOrderLines((lines) => {
              const copy = [...lines];
              copy[index].additions = arr;
              return copy;
            });
          } else {
            const arr = Array.from(selectedRems.values());
            setOrderLines((lines) => {
              const copy = [...lines];
              copy[index].removals = arr;
              return copy;
            });
          }
          Swal.close();
        });
      },
    });
  };

  const removeLine = (i) => setOrderLines((lines) => lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, v) =>
    setOrderLines((lines) => {
      const copy = [...lines];
      copy[i][field] = v;
      return copy;
    });

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
    const additions = modifiers.filter((m) => ADD_TYPES.has(String(m.type || "").toLowerCase().trim()));
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

  const buildTicketHtml = (order) => {
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
    const estab = estName || order.establishment_name || "";
    const items = Array.isArray(order.items) ? order.items : [];

    const itemRows = items
      .map((it, idx) => {
        const name = (it.item?.name || it.name || "").replace("(Combo)", "").trim();
        const { qty, additions, lineSubtotal } = calcItemLine(it);
        const addRows = additions
          .map((m) => {
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
          })
          .join("");
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
          })
          .join("");
        return `
          <div class="row leader item">
            <div class="l">#${idx + 1} · x${qty} ${name}</div>
            <div class="r">${money(lineSubtotal)}</div>
          </div>
          ${addRows}
          ${removalRows}
        `;
      })
      .join("");

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
            pre { white-space: pre-wrap; }
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

  const buildReceiptText = (order) => {
    const WIDTH = 32;
    const center = (text) => text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);
    const line = (char = "-") => char.repeat(WIDTH);
    const fmt = (v) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };
    const consLabel = fulfillmentLabels[order.fulfillment] || order.fulfillment || "";
    const origLabel = originLabels[order.origin] || order.origin || "";
    const L = [];
    L.push("");
    L.push("─".repeat(WIDTH));
    L.push(center(estName));
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
    const dt = order.order_datetime ? new Date(order.order_datetime) : new Date();
    L.push(`Data: ${dt.toLocaleString("pt-BR", { hour12: false })}`);
    L.push("");
    L.push("");
    return L.join("\n");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      app_id: 3,
      entity_name: "establishment",
      entity_id: +entityId,
      items: orderLines.map((l) => ({
        item_id: l.product.id,
        quantity: l.quantity,
        additions: l.additions.flatMap((a) => Array(a.quantity).fill(a.id)),
        removals: l.removals,
      })),
      ...form,
    };
    try {
      const token = localStorage.getItem("token");
      const { data: created } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: fetched } = await axios.get(`${apiBaseUrl}/order/${created.order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const receiptText = buildReceiptText(fetched.order);
      await Swal.fire({
        title: `Recibo Pedido #${fetched.order.order_number}`,
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
          const html = buildTicketHtml(fetched.order);
          const w = window.open("", "", "width=520,height=800");
          w.document.write(html);
          w.document.close();
          w.focus();
        } else if (result.isDenied) {
          navigator.clipboard.writeText(receiptText).then(() => {
            Swal.fire({
              icon: "success",
              title: "Copiado!",
              text: "O recibo foi copiado para a área de transferência.",
              confirmButtonText: "OK",
              background: "#0b0b0b",
              color: "#fff",
              customClass: { confirmButton: "order-modal__swal-btn" },
            });
          });
        }
      });
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err?.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível criar pedido.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner animation="border" className="order-loading__spinner" />;

  return (
    <>
      <NavlogComponent />
      <Container className="order-create__container">
        <div className="order-create__header">
          {estLogo && (
            <img
              src={`${storageUrl}/${estLogo}`}
              alt={`${estName} logo`}
              className="order-create__logo"
              onError={(e) => {
                e.currentTarget.src = "/images/logo.png";
              }}
            />
          )}
          <p className="order-create__establishment-name">
            <strong>{estName}</strong>
          </p>
          <Button as={Link} to={`/order/list/${entityId}`} variant="info" size="sm" className="order-create__btn-orders">
            Ver Pedidos
          </Button>
        </div>
        <Button variant="success" onClick={handleAddItem} className="order-create__btn-add-item">
          + Adicionar Item
        </Button>
        <div className="order-create__total">
          <h5>Total: {formattedTotal}</h5>
        </div>
        <div className="order-lines__block">
          <p className="order-lines__title">Itens do Pedido</p>
          <Row className="order-lines__list">
            {orderLines.map((line, i) => (
              <Row key={i} className="order-line__row">
                <Col xs={12} lg={4} className="order-line__product">
                  <span className="order-line__product-name">
                    {line.product.name} – R$ {line.product.price}
                  </span>
                  <Button size="sm" variant="outline-danger" className="order-line__btn-remove" onClick={() => removeLine(i)}>
                    ×
                  </Button>
                </Col>
                <Col xs={12} sm={6} lg={2} className="order-line__quantity">
                  <Button
                    size="sm"
                    variant="outline-info"
                    className="order-line__btn-minus"
                    onClick={() => updateLine(i, "quantity", Math.max(1, Number(line.quantity || 1) - 1))}
                  >
                    −
                  </Button>
                  <span className="order-line__quantity-value">{line.quantity}</span>
                  <Button size="sm" variant="outline-info" className="order-line__btn-plus" onClick={() => updateLine(i, "quantity", Number(line.quantity || 1) + 1)}>
                    +
                  </Button>
                </Col>
                <Col xs={12} sm={6} lg={3} className="order-line__modifiers">
                  <Button size="sm" variant="outline-primary" className="order-line__btn-addition" onClick={() => handleManage(i, "additions")}>
                    Adicionais
                  </Button>
                  <Button size="sm" variant="outline-secondary" className="order-line__btn-removal" onClick={() => handleManage(i, "removals")}>
                    Remoções
                  </Button>
                </Col>
                <div className="order-line__badges">
                  {line.additions.map((a) => {
                    const addProduct = products.find((p) => p.id === a.id);
                    return (
                      <Badge key={`add-${a.id}`} bg="success" className="order-line__badge-addition">
                        + {a.quantity} {addProduct?.name} – R$ {addProduct?.price}
                      </Badge>
                    );
                  })}
                  {line.removals.map((rid) => {
                    const remProduct = products.find((p) => p.id === rid);
                    return (
                      <Badge key={`rem-${rid}`} bg="danger" className="order-line__badge-removal">
                        − {remProduct?.name}
                      </Badge>
                    );
                  })}
                </div>
              </Row>
            ))}
          </Row>
        </div>
        <Form onSubmit={handleSubmit} className="order-create__form">
          <Row className="order-create__form-row">
            <Col md={4}>
              <Form.Group controlId="customer" className="order-create__form-group">
                <Form.Label className="order-create__label">Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="order-create__input"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="order-create__form-row">
            <Col md={2}>
              <Form.Group controlId="origin" className="order-create__form-group">
                <Form.Label className="order-create__label">Origem</Form.Label>
                <Form.Select value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} className="order-create__select">
                  {Object.keys(originLabels).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId="fulfillment" className="order-create__form-group">
                <Form.Label className="order-create__label">Consumo</Form.Label>
                <Form.Select value={form.fulfillment} onChange={(e) => setForm((f) => ({ ...f, fulfillment: e.target.value }))} className="order-create__select">
                  {Object.entries(fulfillmentLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId="payment_status" className="order-create__form-group">
                <Form.Label className="order-create__label">Status Pagamento</Form.Label>
                <Form.Select value={form.payment_status} onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))} className="order-create__select">
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group controlId="payment_method" className="order-create__form-group">
                <Form.Label className="order-create__label">Método Pagamento</Form.Label>
                <Form.Select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className="order-create__select">
                  <option>Dinheiro</option>
                  <option>Pix</option>
                  <option>Crédito</option>
                  <option>Débito</option>
                  <option>Fiado</option>
                  <option>Cortesia</option>
                  <option>Transferência bancária</option>
                  <option>Vale-refeição</option>
                  <option>Cheque</option>
                  <option>PayPal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="order-create__form-row">
            <Col md={12}>
              <Form.Group controlId="notes" className="order-create__form-group">
                <Form.Label className="order-create__label">Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="order-create__textarea"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center">
              <Button type="submit" className="order-create__btn-submit" disabled={submitting}>
                {submitting ? <Spinner animation="border" size="sm" /> : "Criar Pedido"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

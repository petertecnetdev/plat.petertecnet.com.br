import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./Order.css";

export default function OrderEditPage() {
  const { entityId, id: orderId } = useParams();
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
        const [resItems, resEst, resOrder] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(resItems.data);
        const est = resEst.data.establishment;
        setEstName((est.name || "").toUpperCase());
        setEstLogo(est.logo || "");
        const o = resOrder.data.order;
        setForm({
          customer_name: o.customer_name,
          id: o.id,
          date: o.created_at,
          origin: o.origin,
          fulfillment: o.fulfillment,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          notes: o.notes || "",
        });
        setOrderLines(
          (o.items || []).map((it) => ({
            product: it.item,
            quantity: it.quantity,
            additions: (it.modifiers || [])
              .filter(
                (m) =>
                  String(m.type || "")
                    .toLowerCase()
                    .trim() === "addition"
              )
              .map((m) => ({
                id: m.modifier_id ?? m.modifier?.id ?? m.modifierId,
                quantity: m.quantity || 1,
              })),
            removals: (it.modifiers || [])
              .filter(
                (m) =>
                  String(m.type || "")
                    .toLowerCase()
                    .trim() === "removal"
              )
              .map((m) => m.modifier_id ?? m.modifier?.id ?? m.modifierId),
          }))
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId, orderId]);

  const total = useMemo(() => {
    let t = 0;
    orderLines.forEach((line) => {
      t += line.quantity * Number(line.product.price);
      line.additions.forEach((a) => {
        const prod = products.find((p) => p.id === a.id);
        if (prod) t += Number(prod.price) * a.quantity;
      });
    });
    return t;
  }, [orderLines, products]);

  const formattedTotal = `R$${total.toFixed(2).replace(".", ",")}`;

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
              <span class="order-modal__item-price">R$ ${Number(p.price)
                .toFixed(2)
                .replace(".", ",")}</span>
            </div>
            <button class="order-modal__item-add" data-id="${
              p.id
            }">Adicionar</button>
          </div>
        </div>
      `
      )
      .join("");
  };

  const handleAddItem = async () => {
    const categories = Array.from(
      new Set(products.map((p) => p.category || "Outros"))
    );
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
                          class="order-modal__tab${
                            idx === currentIndex
                              ? " order-modal__tab--active"
                              : ""
                          }"
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
        </div>
      `;
    };

    await Swal.fire({
      html: getHtml(),
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      width: "100vw",
      heightAuto: false,
      background: "#000",
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
        cancelButton: "order-modal__swal-btn-cancel",
      },
      didOpen: () => {
        let startX = 0;
        let isTouching = false;
        const root = Swal.getHtmlContainer();

        root.addEventListener("touchstart", (e) => {
          const grid = root.querySelector(".order-modal__items-grid");
          if (!grid || !grid.contains(e.target)) return;
          isTouching = true;
          startX = e.touches[0].clientX;
        });

        root.addEventListener("touchend", (e) => {
          if (!isTouching) return;
          isTouching = false;
          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) < 40) return;
          if (diff < 0 && currentIndex < categories.length - 1) {
            lastDirection = "left";
            currentIndex += 1;
          } else if (diff > 0 && currentIndex > 0) {
            lastDirection = "right";
            currentIndex -= 1;
          } else if (diff < 0 && currentIndex === categories.length - 1) {
            lastDirection = "left";
            currentIndex = 0;
          } else if (diff > 0 && currentIndex === 0) {
            lastDirection = "right";
            currentIndex = categories.length - 1;
          }
          Swal.update({ html: getHtml() });
        });

        root.addEventListener("click", (e) => {
          const tab = e.target.closest(".order-modal__tab");
          if (tab) {
            lastDirection = null;
            currentIndex = Number(tab.dataset.catIndex);
            Swal.update({ html: getHtml() });
            return;
          }
          const addBtn = e.target.closest(".order-modal__item-add");
          if (addBtn) {
            const id = Number(addBtn.dataset.id);
            const prod = products.find((p) => p.id === id);
            if (!prod) return;
            setOrderLines((lines) => [
              ...lines,
              { product: prod, quantity: 1, additions: [], removals: [] },
            ]);
            Swal.close();
          }
        });
      },
    });
  };

  const handleManage = async (index, type) => {
    const additionsProducts = products.filter(
      (p) => (p.category || "").toLowerCase() === "adicionais"
    );
    const orderLine = orderLines[index];
    const selectedAdds = new Map(
      (type === "additions" ? orderLine.additions : []).map((a) => [
        a.id,
        a.quantity,
      ])
    );
    const selectedRems = new Set(type === "removals" ? orderLine.removals : []);

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
                        <span class="order-modal__item-price">R$ ${Number(
                          p.price
                        )
                          .toFixed(2)
                          .replace(".", ",")}</span>
                      </div>
                      <div class="order-modal__qty">
                        <button class="order-modal__qty-btn" data-act="dec" data-id="${
                          p.id
                        }">−</button>
                        <span class="order-modal__qty-val" data-id="${
                          p.id
                        }">${qty}</span>
                        <button class="order-modal__qty-btn" data-act="inc" data-id="${
                          p.id
                        }">+</button>
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
                      <button class="order-modal__toggle${
                        on ? " is-on" : ""
                      }" data-id="${p.id}">
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
        <div class="order-modal__category-title">${
          type === "additions" ? "Adicionais" : "Remoções"
        }</div>
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
        root.addEventListener("click", (e) => {
          const btnQty = e.target.closest(".order-modal__qty-btn");
          if (btnQty) {
            const id = Number(btnQty.dataset.id);
            const act = btnQty.dataset.act;
            const curr = selectedAdds.get(id) || 0;
            const next = Math.max(0, curr + (act === "inc" ? 1 : -1));
            if (next === 0) selectedAdds.delete(id);
            else selectedAdds.set(id, next);
            const valEl = root.querySelector(
              `.order-modal__qty-val[data-id="${id}"]`
            );
            if (valEl) valEl.textContent = String(next);
            return;
          }
          const toggle = e.target.closest(".order-modal__toggle");
          if (toggle) {
            const id = Number(toggle.dataset.id);
            if (selectedRems.has(id)) selectedRems.delete(id);
            else selectedRems.add(id);
            toggle.classList.toggle("is-on");
            toggle.textContent = toggle.classList.contains("is-on")
              ? "Remover ✓"
              : "Remover";
            return;
          }
          if (e.target.matches('[data-close="1"]')) {
            Swal.close();
            return;
          }
          if (e.target.matches('[data-save="1"]')) {
            if (type === "additions") {
              const arr = Array.from(selectedAdds.entries()).map(
                ([id, quantity]) => ({ id, quantity })
              );
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
          }
        });
      },
    });
  };

  const removeLine = (i) =>
    setOrderLines((lines) => lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, v) =>
    setOrderLines((lines) => {
      const copy = [...lines];
      copy[i][field] = v;
      return copy;
    });

  const money = (n) =>
    `R$ ${Number(n || 0)
      .toFixed(2)
      .replace(".", ",")}`;
  const ADD_TYPES = new Set([
    "addition",
    "combo",
    "extra",
    "adicional",
    "upgrade",
  ]);
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
      ADD_TYPES.has(
        String(m.type || "")
          .toLowerCase()
          .trim()
      )
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
    const s = String(raw || "")
      .toLowerCase()
      .trim();
    if (["pending", "pedding"].includes(s)) return "Pendente";
    if (s === "paid") return "Pago";
    if (s === "previsto") return "Previsto";
    if (s === "canceled" || s === "cancelled") return "Cancelado";
    if (s === "refunded") return "Estornado";
    if (s === "failed") return "Falhou";
    if (s === "partial") return "Parcial";
    return raw || "-";
  };

  const handlePrint = async (order) => {
    const PAPER_MM = 80;
    const CONTENT_MM = 70;
    const FONT_PT = 18;
    const BIG_PT = 28;
    const mapFulfillment = {
      "dine-in": "LOCAL",
      "take-away": "LEVAR",
      delivery: "DELIVERY",
    };
    const printId = order?.id ?? order?.order_id ?? Number(orderId);
    const mapOrigin = {
      Balcão: "Balcão",
      WhatsApp: "WhatsApp",
      Telefone: "Telefone",
      App: "Aplicativo",
    };
    const dataHora = order.order_datetime
      ? new Date(order.order_datetime).toLocaleString("pt-BR", {
          hour12: false,
        })
      : new Date().toLocaleString("pt-BR", { hour12: false });
    const cliente = order.customer_name || "-";
    const origem = mapOrigin[order.origin] || order.origin || "-";
    const consumo =
      mapFulfillment[order.fulfillment] || order.fulfillment || "-";
    const metodo = order.payment_method || "-";
    const statusPag = mapPaymentStatus(order.payment_status);
    const obs = order.notes || "";
    const access = order.access_code || "";
    const estab = estName || order.establishment_name || "";
    const items = Array.isArray(order.items) ? order.items : [];

    const itemRows = items
      .map((it, idx) => {
        const name = (it.item?.name || it.name || "")
          .replace("(Combo)", "")
          .trim();
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
          .filter(
            (m) =>
              String(m.type || "")
                .toLowerCase()
                .trim() === "removal"
          )
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

    const grandTotal = items.reduce(
      (acc, it) => acc + calcItemLine(it).lineSubtotal,
      0
    );

    const w = window.open("", "", "width=520,height=800");
    w.document.write(`
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
           <div class="center" style="margin:6px 0 8px;">
  <span class="bigcode">${printId}</span>
</div>
            <div class="center" style="margin:6px 0 8px;"><span class="bigcode">${order.id}</span></div>
            ${
              access
                ? `<div class="row"><div class="l"><span class="label">Código</span></div><div class="r">${access}</div></div>`
                : ""
            }
            <div class="sep"></div>
            <div class="row"><div class="l"><span class="label">Data</span></div><div class="r">${dataHora}</div></div>
            <div class="row"><div class="l"><span class="label">Cliente</span></div><div class="r">${cliente}</div></div>
            <div class="row"><div class="l"><span class="label">Origem</span></div><div class="r">${origem}</div></div>
            <div class="row"><div class="l"><span class="label">Consumo</span></div><div class="r">${consumo}</div></div>
            <div class="sep"></div>
            <div class="center"><span class="label">ITENS DO PEDIDO (${
              items.length
            })</span></div>
            ${itemRows}
            <div class="sep"></div>
            <div class="row"><div class="l"><span class="label">Pagamento</span></div><div class="r">${metodo}</div></div>
            <div class="row"><div class="l"><span class="label">Status</span></div><div class="r">${statusPag}</div></div>
            ${
              obs
                ? `<div class="sep"></div><div><span class="label">Obs.:</span> ${obs}</div>`
                : ""
            }
            <div class="sep"></div>
            <div class="row total leader"><div class="l">Total</div><div class="r">${money(
              grandTotal
            )}</div></div>
          </div>
          <script>
            window.onload = function () {
              setTimeout(function(){ window.print(); }, 120);
              setTimeout(function(){ window.close(); }, 420);
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
  };
// SUBSTITUIR TUDO por esta função
// SUBSTITUIR buildTextReceipt por esta versão
const buildTextReceipt = (order) => {
  const WIDTH = 32;
  const line = (c = "─") => c.repeat(WIDTH);
  const center = (t = "") =>
    t.trim().padStart(Math.floor((WIDTH + t.length) / 2)).padEnd(WIDTH);
  const fmt = (n) =>
    `R$ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
  const rowDots = (left, right) => {
    const l = left.trim();
    const r = right.trim();
    const dots = Math.max(1, WIDTH - l.length - r.length);
    return `${l}${".".repeat(dots)}${r}`;
  };

  const dt = order.order_datetime
    ? new Date(order.order_datetime)
    : new Date();

  const estab = (order.establishment_name || estName || "").toUpperCase();
  const cliente = (order.customer_name || "-").toUpperCase();
  const orig = (order.origin || "").toString().toUpperCase();
  const cons = (order.fulfillment || "").toString().toUpperCase();

  let L = [];

  // Cabeçalho
  L.push(line("─"));
  L.push(center(estab));
  L.push(line("─"));
  L.push("");

  // Dados principais
  L.push(`Cliente: ${cliente}`);
  L.push(`Origem: ${orig}`);
  L.push(`Consumo: ${cons}`);

  // Seção itens
  L.push(line("-"));
  L.push(center("ITENS DO PEDIDO"));
  L.push(line("-"));

  let total = 0;

  (order.items || []).forEach((it) => {
    const name = (it.item?.name || it.name || "").replace("(Combo)", "").trim();
    const qty = Number(it.quantity || 1);
    const unitPrice = Number(it.item?.price ?? it.price ?? 0);

    const baseSubtotal = qty * unitPrice;
    total += baseSubtotal;

    // Linha principal do item (sem adicionais)
    L.push(rowDots(`${qty}x ${name}`, fmt(baseSubtotal)));

    // Adicionais
    const additions = (Array.isArray(it.modifiers) ? it.modifiers : []).filter(
      (m) =>
        ["addition", "combo", "extra", "adicional", "upgrade"].includes(
          String(m.type || "").toLowerCase().trim()
        )
    );

    additions.forEach((m) => {
      const mName =
        m.name ||
        m.item?.name ||
        (products.find((p) => p.id === m.modifier_id)?.name ?? "Adicional");
      const unit = Number(
        m.price ??
          m.item?.price ??
          (products.find((p) => p.id === m.modifier_id)?.price ?? 0)
      );
      const qpu = Number(m.quantity || 1);
      const subtotalAdd = unit * qpu * qty;
      total += subtotalAdd;
      L.push(rowDots(`  + ${qpu}x ${mName}`, fmt(subtotalAdd)));
    });

    // Remoções (sem valor)
    const removals = (Array.isArray(it.modifiers) ? it.modifiers : []).filter(
      (m) => String(m.type || "").toLowerCase().trim() === "removal"
    );
    removals.forEach((m) => {
      const mName =
        m.name ||
        m.item?.name ||
        (products.find((p) => p.id === m.modifier_id)?.name ?? "Item");
      L.push(`  - sem ${mName}`);
    });
  });

  // Total geral
  L.push(line("-"));
  L.push(rowDots("TOTAL", fmt(total)));
  L.push("");

  // Data final
  L.push(`Data: ${dt.toLocaleString("pt-BR", { hour12: false })}`);

  return L.join("\n");
};


  const showReceiptSwal = async (order) => {
    const text = buildTextReceipt(order);
    await Swal.fire({
      title: `Recibo #${order.id}`,
      html: `
        <div class="receipt-modal">
          <pre id="receipt-text" class="receipt-pre" style="text-align:left;max-height:50vh;overflow:auto;margin:0">${text.replace(
            /</g,
            "&lt;"
          )}</pre>
          <div class="receipt-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button type="button" class="swal2-styled" data-act="print">Imprimir</button>
            <button type="button" class="swal2-styled" data-act="copy">Copiar</button>
            <button type="button" class="swal2-styled swal2-cancel" data-act="close">Fechar</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      background: "#111",
      color: "#fff",
      width: "700px",
      didOpen: () => {
        const root = Swal.getHtmlContainer();
        root.addEventListener("click", async (e) => {
          const btn = e.target.closest("[data-act]");
          if (!btn) return;
          const act = btn.getAttribute("data-act");
          if (act === "print") {
            await handlePrint(order);
          } else if (act === "copy") {
            const plain =
              document.getElementById("receipt-text")?.innerText || text;
            try {
              await navigator.clipboard.writeText(plain);
              Swal.showValidationMessage("");
              Swal.resetValidationMessage();
              Swal.update({
                footer:
                  '<div style="color:#8f8">Texto copiado para a área de transferência.</div>',
              });
              setTimeout(() => {
                const f = Swal.getFooter();
                if (f) f.innerHTML = "";
              }, 1600);
            } catch {
              const ta = document.createElement("textarea");
              ta.value = plain;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              Swal.update({
                footer:
                  '<div style="color:#8f8">Texto copiado (fallback).</div>',
              });
              setTimeout(() => {
                const f = Swal.getFooter();
                if (f) f.innerHTML = "";
              }, 1600);
            }
          } else if (act === "close") {
            Swal.close();
          }
        });
      },
    });
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
      await axios.put(`${apiBaseUrl}/order/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data: fetched } = await axios.get(
        `${apiBaseUrl}/order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await showReceiptSwal(fetched.order);
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível atualizar pedido.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner animation="border" className="order-loading__spinner" />;
  }

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

          <Button
            as={Link}
            to={`/order/list/${entityId}`}
            variant="info"
            size="sm"
            className="order-create__btn-orders"
          >
            Ver Pedidos
          </Button>
        </div>
        <Button
          variant="success"
          onClick={handleAddItem}
          className="order-create__btn-add-item"
        >
          + Adicionar Item
        </Button>
        <div className="order-number">
          <p>{form.id}</p>
          <h5>Total: {formattedTotal}</h5>
          <div className="order-date">
            {form.date
              ? new Date(form.date).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </div>
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
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="order-line__btn-remove"
                    onClick={() => removeLine(i)}
                  >
                    ×
                  </Button>
                </Col>
                <Col xs={12} sm={6} lg={2} className="order-line__quantity">
                  <Button
                    size="sm"
                    variant="outline-info"
                    className="order-line__btn-minus"
                    onClick={() =>
                      updateLine(i, "quantity", Math.max(1, line.quantity - 1))
                    }
                  >
                    −
                  </Button>
                  <span className="order-line__quantity-value">
                    {line.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline-info"
                    className="order-line__btn-plus"
                    onClick={() => updateLine(i, "quantity", line.quantity + 1)}
                  >
                    +
                  </Button>
                </Col>
                <Col xs={12} sm={6} lg={3} className="order-line__modifiers">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="order-line__btn-addition"
                    onClick={() => handleManage(i, "additions")}
                  >
                    Adicionais
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="order-line__btn-removal"
                    onClick={() => handleManage(i, "removals")}
                  >
                    Remoções
                  </Button>
                </Col>
                <div className="order-line__badges">
                  {line.additions.map((a) => {
                    const addProduct = products.find((p) => p.id === a.id);
                    return (
                      <Badge
                        key={`add-${a.id}`}
                        bg="success"
                        className="order-line__badge-addition"
                      >
                        + {a.quantity} {addProduct?.name} – R${" "}
                        {addProduct?.price}
                      </Badge>
                    );
                  })}
                  {line.removals.map((rid) => {
                    const remProduct = products.find((p) => p.id === rid);
                    return (
                      <Badge
                        key={`rem-${rid}`}
                        bg="danger"
                        className="order-line__badge-removal"
                      >
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
              <Form.Group
                controlId="customer"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                  className="order-create__input"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="order-create__form-row">
            <Col md={2}>
              <Form.Group
                controlId="origin"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Origem</Form.Label>
                <Form.Select
                  value={form.origin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, origin: e.target.value }))
                  }
                  className="order-create__select"
                >
                  {Object.keys(originLabels).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="fulfillment"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">Consumo</Form.Label>
                <Form.Select
                  value={form.fulfillment}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fulfillment: e.target.value }))
                  }
                  className="order-create__select"
                >
                  {Object.entries(fulfillmentLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="payment_status"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Status Pagamento
                </Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_status: e.target.value }))
                  }
                  className="order-create__select"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group
                controlId="payment_method"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Método Pagamento
                </Form.Label>
                <Form.Select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_method: e.target.value }))
                  }
                  className="order-create__select"
                >
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
              <Form.Group
                controlId="notes"
                className="order-create__form-group"
              >
                <Form.Label className="order-create__label">
                  Observações
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="order-create__textarea"
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center">
              <Button
                type="submit"
                className="order-create__btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

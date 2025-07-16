// src/pages/order/OrderEditPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { apiBaseUrl } from "../../config";

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
    origin: "WhatsApp",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: "",
  });
  const [orderLines, setOrderLines] = useState([]);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const [resItems, resEst, resOrder] = await Promise.all([
          axios.get(
            `${apiBaseUrl}/item?entity_name=establishment&entity_id=${entityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(resItems.data);
        const est = resEst.data.establishment;
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo_url || "");

        const o = resOrder.data.order;
        setForm({
          customer_name: o.customer_name,
          origin: o.origin,
          fulfillment: o.fulfillment,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          notes: o.notes || "",
        });
        setOrderLines(
          o.items.map((it) => ({
            product: it.item,
            quantity: it.quantity,
            additions: it.modifiers
              .filter((m) => m.type === "addition")
              .map((m) => ({ id: m.modifier.id, quantity: m.quantity || 1 })),
            removals: it.modifiers
              .filter((m) => m.type === "removal")
              .map((m) => m.modifier.id),
          }))
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId, orderId]);

  const buildReceipt = (order) => {
    const W = 32;
    const center = (t) =>
      t.padStart(Math.floor((W + t.length) / 2)).padEnd(W);
    const line = () => "-".repeat(W);
    const fmt = (v) =>
      `R$${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(
        Math.max(W - (l.length + r.length), 0)
      );
      return `${l}${dots}${r}`;
    };

    const L = [];
    L.push("");
    L.push("█".repeat(W));
    L.push(center(estName));
    L.push("█".repeat(W));
    L.push("");
    L.push(
      `👤 Cliente: ${(order.customer_name || "").toUpperCase()}`
    );
    L.push(
      `📦 Origem: ${
        originLabels[order.origin] || order.origin
      }`.toUpperCase()
    );
    L.push(
      `🍽️ Consumo: ${
        fulfillmentLabels[order.fulfillment] || order.fulfillment
      }`.toUpperCase()
    );
    L.push(line());
    L.push(center("ITENS DO PEDIDO"));
    L.push(line());

    let total = 0;
    order.items.forEach((it) => {
      const qty = it.quantity;
      const name = it.item.name;
      const sub = Number(it.subtotal);
      total += sub;
      L.push(pad(`${qty}x ${name}`, fmt(sub)));

      it.modifiers
        .filter((m) => m.type === "addition")
        .forEach((m) => {
          const prod = products.find((p) => p.id === m.modifier.id);
          const unit = prod ? Number(prod.price) : 0;
          const count = m.quantity || 1;
          const subAdd = unit * count;
          total += subAdd;
          L.push(
            pad(`  + ${prod?.name}`, fmt(subAdd))
          );
        });
      it.modifiers
        .filter((m) => m.type === "removal")
        .forEach((m) => {
          L.push(`  - ${m.modifier.name}`);
        });
    });

    L.push(line());
    L.push(pad("TOTAL", fmt(total)));
    L.push("");
    L.push(
      `Data: ${new Date(
        order.order_datetime
      ).toLocaleString("pt-BR", {
        hour12: false,
      })}`
    );
    L.push("");
    return L.join("\n");
  };

  const handleAddItem = async () => {
    const available = products.filter((p) => p.category !== "Adicionais");
    const grouped = available.reduce((acc, p) => {
      const c = p.category || "Outros";
      (acc[c] = acc[c] || []).push(p);
      return acc;
    }, {});
    let cat = Object.keys(grouped)[0];

    const html = `
      <style>
        .swal2-popup { width:100vw!important; height:100vh!important; }
        .category-tabs { display:flex; gap:8px; padding:8px; background:#1A1A1A; }
        .category-tab { padding:4px 8px; border:1px solid #FDAE26; color:#FDAE26; cursor:pointer; }
        .category-tab.active { background:#FDAE26; color:#1A1A1A; }
        .item-list { padding:8px; display:flex; flex-wrap:wrap; gap:8px; max-height:calc(100vh - 56px); overflow:auto; }
        .item-card { flex:1 0 calc(25% - 16px); padding:8px; border:1px solid #FDAE26; cursor:pointer; }
      </style>
      <div class="category-tabs">
        ${Object.keys(grouped)
          .map(
            (c) =>
              `<div class="category-tab${
                c === cat ? " active" : ""
              }" data-cat="${c}">${c}</div>`
          )
          .join("")}
      </div>
      <div class="item-list" id="item-list"></div>
    `;
    const render = () => {
      const cont = document.getElementById("item-list");
      cont.innerHTML = grouped[cat]
        .map(
          (p) =>
            `<div class="item-card" data-id="${p.id}">
               ${p.name} — R$${Number(p.price)
                 .toFixed(2)
                 .replace(".", ",")}
             </div>`
        )
        .join("");
      cont.querySelectorAll(".item-card").forEach((el) =>
        el.addEventListener("click", () => {
          const pid = +el.dataset.id;
          const prod = products.find((x) => x.id === pid);
          setOrderLines((ol) => [
            ...ol,
            { product: prod, quantity: 1, additions: [], removals: [] },
          ]);
          Swal.close();
        })
      );
    };

    await Swal.fire({
      html,
      showCancelButton: true,
      showConfirmButton: false,
      didRender: () => {
        document
          .querySelectorAll(".category-tab")
          .forEach((tab) =>
            tab.addEventListener("click", () => {
              document
                .querySelectorAll(".category-tab")
                .forEach((t) => t.classList.remove("active"));
              cat = tab.dataset.cat;
              tab.classList.add("active");
              render();
            })
          );
        render();
      },
    });
  };

  const handleManage = async (i, type) => {
    const opts = products.filter((p) => p.category === "Adicionais");
    let html = `<form id="modForm">`;
    opts.forEach((o) => {
      const exist = orderLines[i][type].find((a) => a.id === o.id);
      const qty = exist?.quantity || 1;
      html += `<div style="display:flex;justify-content:space-between">
        <label>
          <input type="checkbox" value="${o.id}" name="mod"${
        exist ? " checked" : ""
      }/> ${o.name}
        </label>
        ${
          type === "additions"
            ? `<input id="qty-${o.id}" type="number" min="1" value="${qty}" style="width:40px"/>`
            : ""
        }
      </div>`;
    });
    html += `</form>`;
    const res = await Swal.fire({
      title: type === "additions" ? "Adicionais" : "Remoções",
      html,
      showCancelButton: true,
      preConfirm: () => {
        const checked = Array.from(
          document.querySelectorAll("#modForm input[name='mod']:checked")
        ).map((el) => +el.value);
        return type === "additions"
          ? checked.map((id) => ({
              id,
              quantity: +document.getElementById(`qty-${id}`)?.value || 1,
            }))
          : checked;
      },
    });
    if (res.value !== undefined) {
      setOrderLines((ol) => {
        const c = [...ol];
        c[i][type] = res.value;
        return c;
      });
    }
  };

  const removeLine = (i) =>
    setOrderLines((ol) => ol.filter((_, idx) => idx !== i));
  const updateLine = (i, f, v) =>
    setOrderLines((ol) => {
      const c = [...ol];
      c[i][f] = v;
      return c;
    });

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
        additions: l.additions.flatMap((a) =>
          Array(a.quantity).fill(a.id)
        ),
        removals: l.removals,
      })),
      ...form,
    };
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${apiBaseUrl}/order/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data } = await axios.get(
        `${apiBaseUrl}/order/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const text = buildReceipt(data.order);
      await Swal.fire({
        title: `Recibo Pedido #${data.order.order_number}`,
        html: `<pre style="font-family:monospace;white-space:pre-wrap">${text}</pre>`,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
      });
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

  if (loading)
    return (
      <Spinner animation="border" className="mt-5 d-block mx-auto" />
    );

  return (
    <>
      <NavlogComponent />
      <Container className="m-4">
        <div className="est-header text-center mb-4">
          {estLogo && (
            <img
              src={estLogo}
              alt={`${estName} logo`}
              className="est-logo mb-2"
            />
          )}
          <h6 className="bg-dark text-white py-1 px-3 rounded d-inline-block">
            <strong>{estName}</strong>
          </h6>
        </div>

        <Button variant="success" onClick={handleAddItem}>
          + Adicionar Item
        </Button>

        <Row className="order-lines mt-3">
          {orderLines.map((line, i) => (
            <Row
              key={i}
              className="order-line-row align-items-center border-bottom"
            >
              <Col xs={12} lg={4} className="d-flex align-items-center">
                <span className="flex-grow-1 text-truncate">
                  {line.product.name}
                </span>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => removeLine(i)}
                >
                  ×
                </Button>
              </Col>
              <Col xs={12} sm={6} lg={2} className="d-flex align-items-center">
                <Button
                  size="sm"
                  variant="outline-info"
                  onClick={() =>
                    updateLine(i, "quantity", Math.max(1, line.quantity - 1))
                  }
                >
                  −
                </Button>
                <span className="mx-2 fw-bold">{line.quantity}</span>
                <Button
                  size="sm"
                  variant="outline-info"
                  onClick={() =>
                    updateLine(i, "quantity", line.quantity + 1)
                  }
                >
                  +
                </Button>
              </Col>
              <Col xs={12} sm={6} lg={3} className="d-flex gap-2">
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => handleManage(i, "additions")}
                >
                  Adicionais
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => handleManage(i, "removals")}
                >
                  Remoções
                </Button>
              </Col>
              <Col xs={12} lg={3} className="d-flex flex-wrap gap-1">
                {line.additions.map((a) => (
                  <Badge key={`add-${a.id}`} bg="success">
                    +{a.quantity}{" "}
                    {products.find((p) => p.id === a.id)?.name}
                  </Badge>
                ))}
                {line.removals.map((rid) => (
                  <Badge key={`rem-${rid}`} bg="warning">
                    −{products.find((p) => p.id === rid)?.name}
                  </Badge>
                ))}
              </Col>
            </Row>
          ))}
        </Row>

        <Form onSubmit={handleSubmit} className="mt-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Cliente</Form.Label>
              <Form.Control
                required
                value={form.customer_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customer_name: e.target.value }))
                }
              />
            </Col>
            <Col md={3}>
              <Form.Label>Origem</Form.Label>
              <Form.Select
                value={form.origin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, origin: e.target.value }))
                }
              >
                {Object.keys(originLabels).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Consumo</Form.Label>
              <Form.Select
                value={form.fulfillment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fulfillment: e.target.value }))
                }
              >
                {Object.entries(fulfillmentLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <Row className="g-3 mt-3">
            <Col md={4}>
              <Form.Label>Status Pagamento</Form.Label>
              <Form.Select
                value={form.payment_status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_status: e.target.value,
                  }))
                }
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="failed">Falhou</option>
              </Form.Select>
            </Col>
            <Col md={8}>
              <Form.Label>Método Pagamento</Form.Label>
              <Form.Select
                value={form.payment_method}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_method: e.target.value,
                  }))
                }
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
            </Col>
          </Row>

          <Form.Group className="mt-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </Form.Group>

          <Button type="submit" className="mt-3" disabled={submitting}>
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </Form>
      </Container>
    </>
  );
}

// src/pages/order/OrderCreatePage.js
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
import { apiBaseUrl, storageUrl } from "../../config";

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
        const [resItems, resEst] = await Promise.all([
          axios.get(
            `${apiBaseUrl}/item?entity_name=establishment&entity_id=${entityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(resItems.data);
        const est = resEst.data.establishment;
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const buildReceipt = (order) => {
    const WIDTH = 32;
    const center = (text) =>
      text.padStart(Math.floor((WIDTH + text.length) / 2)).padEnd(WIDTH);
    const line = (char = "-") => char.repeat(WIDTH);
    const fmt = (v) => `R$${Number(v).toFixed(2).replace(".", ",")}`;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };

    const consLabel =
      fulfillmentLabels[order.fulfillment] || order.fulfillment;
    const origLabel = originLabels[order.origin] || order.origin;

    const L = [];
    L.push("");
    L.push("█".repeat(WIDTH));
    L.push(center(estName));
    L.push("█".repeat(WIDTH));
    L.push("");
    L.push(`👤 Cliente: ${(order.customer_name || "").toUpperCase()}`);
    L.push(`📦 Origem: ${origLabel.toUpperCase()}`);
    L.push(`🍽️ Consumo: ${consLabel.toUpperCase()}`);
    L.push(line());
    L.push(center("ITENS DO PEDIDO"));
    L.push(line());

    let total = 0;
    order.items.forEach((it) => {
      const unitPrice = Number(it.item.price);
      const itemSubtotal = unitPrice * it.quantity;
      total += itemSubtotal;
      L.push(pad(`${it.quantity}x ${it.item.name}`, fmt(itemSubtotal)));

      const additions = it.modifiers.filter((m) => m.type === "addition");
      additions.forEach((m) => {
        const prod = products.find((p) => p.id === m.modifier_id);
        if (prod) {
          const addUnit = Number(prod.price || 0);
          const addQty = m.quantity || 1;
          const addSubtotal = addUnit * addQty;
          total += addSubtotal;
          L.push(pad(`  + ${prod.name}`, fmt(addSubtotal)));
        }
      });

      const removals = it.modifiers.filter((m) => m.type === "removal");
      removals.forEach((m) => {
        const prod = products.find((p) => p.id === m.modifier_id);
        if (prod) {
          L.push(`  - ${prod.name}`);
        }
      });
    });

    L.push(line());
    L.push(pad("TOTAL", fmt(total)));
    L.push("");
    L.push(
      `Data: ${new Date(order.order_datetime).toLocaleString("pt-BR", {
        hour12: false,
      })}`
    );
    L.push("");
    L.push("");
    return L.join("\n");
  };

  const handleAddItem = async () => {
    const available = products.filter((p) => p.category !== "Adicionais");
    const grouped = available.reduce((acc, item) => {
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    const categories = Object.keys(grouped);
    let selectedCategory = categories[0];

    const renderHtml = () => `
      <style>
        .swal2-popup.swal2-fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0;
          margin: 0;
          padding: 0;
        }
        .swal2-html-container {
          position: relative !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .category-tabs {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 16px;
          background: #1A1A1A;
          border-bottom: 2px solid #FDAE26;
          overflow-x: auto;
          white-space: nowrap;
          z-index: 10000;
        }
        .category-tab {
          flex: none;
          padding: 8px 16px;
          border: 1px solid #FDAE26;
          background: #1A1A1A;
          color: #FDAE26;
          cursor: pointer;
          white-space: nowrap;
          border-radius: 4px;
        }
        .category-tab.active {
          background: #FDAE26;
          color: #1A1A1A;
        }
        .item-list {
          position: fixed;
          top: 56px; bottom: 0;
          left: 0; right: 0;
          padding: 16px;
          background: #fff;
          overflow-y: auto;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .item-card {
          flex: 1 0 calc(25% - 12px);
          max-width: calc(25% - 12px);
          height: 100px;
          border: 1px solid #FDAE26;
          border-radius: 4px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
        }
        .item-name {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-price {
          font-size: 0.8rem;
          color: #E65100;
        }
      </style>
      <div class="category-tabs">
        ${categories
          .map(
            (cat) =>
              `<div class="category-tab ${
                cat === selectedCategory ? "active" : ""
              }" data-cat="${cat}">${cat}</div>`
          )
          .join("")}
      </div>
      <div class="item-list" id="swal-item-list"></div>
    `;

    const attachEvents = () => {
      const tabs = document.querySelectorAll(".category-tab");
      tabs.forEach((tab) =>
        tab.addEventListener("click", () => {
          selectedCategory = tab.dataset.cat;
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          renderItems();
        })
      );

      function renderItems() {
        const container = document.getElementById("swal-item-list");
        container.innerHTML = grouped[selectedCategory]
          .map(
            (p) => `
              <div class="item-card" data-id="${p.id}">
                <div class="item-name">${p.name}</div>
                <div class="item-price">R$${Number(p.price)
                  .toFixed(2)
                  .replace(".", ",")}</div>
              </div>`
          )
          .join("");
        container
          .querySelectorAll(".item-card")
          .forEach((card) =>
            card.addEventListener("click", () => {
              const id = +card.dataset.id;
              const prod = products.find((x) => x.id === id);
              if (prod) {
                setOrderLines((l) => [
                  ...l,
                  { product: prod, quantity: 1, additions: [], removals: [] },
                ]);
              }
              Swal.close();
            })
          );
      }

      renderItems();
    };

    await Swal.fire({
      title: null,
      html: renderHtml(),
      showCancelButton: true,
      showConfirmButton: false,
      width: "100%",
      heightAuto: false,
      customClass: { popup: "swal2-fullscreen" },
      didRender: attachEvents,
      scrollbarPadding: false,
    });
  };

  const handleManage = async (index, type) => {
    const title = type === "additions" ? "Adicionais" : "Remoções";
    const opts = products.filter((p) => p.category === "Adicionais");
    let html = `<form id="modForm">`;
    opts.forEach((o) => {
      const added = orderLines[index][type].find((m) => m.id === o.id);
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0">
          <label>
            <input type="checkbox" value="${o.id}" name="mod" ${
        added ? "checked" : ""
      }/>
            ${o.name}
          </label>
          ${
            type === "additions"
              ? `<input id="qty-${o.id}" type="number" min="1" value="${
                  added?.quantity || 1
                }" style="width:40px"/>`
              : ""
          }
        </div>`;
    });
    html += `</form>`;
    const res = await Swal.fire({
      title,
      html,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const checked = Array.from(
          document.querySelectorAll("#modForm input[name='mod']:checked")
        ).map((el) => +el.value);
        return type === "additions"
          ? checked.map((id) => ({
              id,
              quantity: Number(
                document.getElementById(`qty-${id}`)?.value || 1
              ),
            }))
          : checked;
      },
    });
    if (res.value !== undefined) {
      setOrderLines((lines) => {
        const c = [...lines];
        c[index][type] = res.value;
        return c;
      });
    }
  };

  const removeLine = (i) =>
    setOrderLines((lines) => lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, v) =>
    setOrderLines((lines) => {
      const c = [...lines];
      c[i][field] = v;
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
        additions: l.additions.flatMap((a) => Array(a.quantity).fill(a.id)),
        removals: l.removals,
      })),      
      ...form,
    };
    try {
      const token = localStorage.getItem("token");
      const { data: created } = await axios.post(
        `${apiBaseUrl}/order`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data: fetched } = await axios.get(
        `${apiBaseUrl}/order/${created.order.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const receiptText = buildReceipt(fetched.order);
      await Swal.fire({
        title: `Recibo Pedido #${fetched.order.order_number}`,
        html: `<pre style="font-family:monospace;white-space:pre-wrap">${receiptText}</pre>`,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
      });
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível criar pedido.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <Spinner animation="border" className="mt-5 d-block mx-auto" />;

  return (
    <>
      <NavlogComponent />
      <Container className="m-4">
        {/* cabeçalho com logo e nome */}
        <div className="est-header text-center mb-4">
          {estLogo && (
            <img 
              src={`${storageUrl}/${estLogo|| "images/logo.png"}`}
              alt={`${estName} logo`}
              className="img-component align-self-left"
            />
          )}
          <p className="bg-dark text-white py-1 px-3 rounded d-inline-block mb-0 ">
            <strong>{estName}</strong>
          </p>
                 </div>

        <Button variant="success" onClick={handleAddItem}>
          + Adicionar Item
        </Button>

        {/* linhas de pedido */}
    <div className="order-lines-container border rounded p-4 mt-3">
  <p className="mb-3 h6">Itens do Pedido</p>
  <Row className="order-lines">
    {orderLines.map((line, i) => (
      <Row
        key={i}
        className="order-line-row align-items-center border-bottom py-2"
      >
        {/* Nome do item + botão remover */}
        <Col xs={12} lg={4} className="d-flex align-items-center mb-2 mb-lg-0">
          <span className="order-line-title flex-grow-1 text-truncate">
            {line.product.name} - R$ {line.product.price}
          </span>
          <Button
            size="sm"
            variant="outline-danger"
            className="ms-2"
            onClick={() => removeLine(i)}
          >
            ×
          </Button>
        </Col>

        {/* Quantidade */}
        <Col xs={12} sm={6} lg={2} className="d-flex align-items-center mb-2 mb-sm-0">
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
            onClick={() => updateLine(i, "quantity", line.quantity + 1)}
          >
            +
          </Button>
        </Col>

        {/* Adicionais / Remoções */}
        <Col xs={12} sm={6} lg={3} className="d-flex gap-2 mb-2 mb-sm-0">
          <Button
            size="sm"
            variant="outline-primary"
            className="flex-grow-1"
            onClick={() => handleManage(i, "additions")}
          >
            Adicionais
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            className="flex-grow-1"
            onClick={() => handleManage(i, "removals")}
          >
            Remoções
          </Button>
        </Col>

        {/* Badges */}
        <Col xs={12} lg={3} className="order-modifiers d-flex flex-wrap gap-1">
          {line.additions.map((a) => (
            <Badge key={`add-${a.id}`} bg="success" className="order-mod-badge ">
              + {a.quantity} {products.find((p) => p.id === a.id)?.name} - R$ {products.find((p) => p.id === a.id)?.price}
            </Badge>
          ))}
          {line.removals.map((rid) => (
            <Badge key={`rem-${rid}`} bg="danger" className="order-mod-badge">
              − {products.find((p) => p.id === rid)?.name}
            </Badge>
          ))}
        </Col>
      </Row>
    ))}
  </Row>
</div>


        {/* formulário de dados e envio */}
        <Form onSubmit={handleSubmit} className="mt-4">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group controlId="customer">
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="origin">
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
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="fulfillment">
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
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mt-3">
            <Col md={4}>
              <Form.Group controlId="payment_status">
                <Form.Label>Status Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_status: e.target.value }))
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="payment_method">
                <Form.Label>Método Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, payment_method: e.target.value }))
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
              </Form.Group>
            </Col>
          </Row>

          <Form.Group controlId="notes" className="mt-3">
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
            {submitting ? <Spinner animation="border" size="sm" /> : "Criar Pedido"}
          </Button>
        </Form>
      </Container>
    </>
  );
}

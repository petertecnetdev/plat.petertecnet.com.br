// src/pages/order/OrderCreatePage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Badge
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

export default function OrderCreatePage() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [estName, setEstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    origin: "WhatsApp",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: ""
  });
  const [orderLines, setOrderLines] = useState([]);

  const fulfillmentLabels = {
    "dine-in": "Local",
    "take-away": "Levar",
    delivery: "Delivery"
  };

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      try {
        const [resItems, resEst] = await Promise.all([
          axios.get(
            `${apiBaseUrl}/item?entity_name=establishment&entity_id=${entityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            `${apiBaseUrl}/establishment/show/${entityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ]);
        setProducts(resItems.data);
        setEstName(resEst.data.establishment.name.toUpperCase());
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const buildReceipt = order => {
    const WIDTH = 42;
    const pad = (l, r) => {
      const dots = ".".repeat(Math.max(WIDTH - (l.length + r.length), 0));
      return `${l}${dots}${r}`;
    };
    const fmt = v =>
      `R$${Number(v)
        .toFixed(2)
        .replace(".", ",")}`;
    const consLabel = fulfillmentLabels[order.fulfillment] || order.fulfillment;
    const L = [];
    L.push("█".repeat(WIDTH));
    L.push(estName.padStart((WIDTH + estName.length) / 2));
    L.push("█".repeat(WIDTH));
    L.push("");
    L.push("ITENS DO PEDIDO".padStart((WIDTH + 15) / 2));
    L.push("-".repeat(WIDTH));
    order.items.forEach(i => {
      const qty = `${i.quantity}x`;
      L.push(pad(`${qty} ${i.item.name}`, fmt(i.subtotal || 0)));
      i.modifiers.forEach(m =>
        L.push(`${m.type === "addition" ? "+ " : "- "}${m.modifier.name}`)
      );
    });
    L.push("-".repeat(WIDTH));
    L.push(pad("TOTAL", fmt(order.total_price)));
    L.push("");
    L.push(`Origem: ${order.origin} | Consumo: ${consLabel}`);
    L.push(
      `Data: ${new Date(order.order_datetime).toLocaleString("pt-BR", {
        hour12: false
      })}`
    );
    return L.join("\n");
  };

  const handleAddItem = async () => {
    const available = products.filter(p => p.category !== "Adicionais");
    let idx = null;
    const html = `
      <style>
        .item-btn {
          display: block;
          width: 100%;
          margin: 4px 0;
          padding: 8px;
          border: 2px solid #FFA500;
          background-color: #FFF3E0;
          color: #E65100;
          border-radius: 4px;
          text-align: left;
          white-space: nowrap;
        }
      </style>
      <div style="max-height:300px; overflow-y:auto;">
        ${available
          .map(
            (p, i) =>
              `<button type="button" class="item-btn" data-idx="${i}">
                ${p.name} — R$ ${Number(p.price)
                  .toFixed(2)
                  .replace(".", ",")}
              </button>`
          )
          .join("")}
      </div>
    `;
    await Swal.fire({
      title: "Selecione Item",
      html,
      showCancelButton: true,
      showConfirmButton: false,
      width: 350,
      didOpen: () => {
        document
          .querySelectorAll(".item-btn")
          .forEach(btn =>
            btn.addEventListener("click", () => {
              idx = Number(btn.dataset.idx);
              Swal.close();
            })
          );
      }
    });
    if (idx !== null) {
      setOrderLines(lines => [
        ...lines,
        { product: available[idx], quantity: 1, additions: [], removals: [] }
      ]);
    }
  };

  const handleManage = async (lineIndex, type) => {
    const title =
      type === "additions" ? "Selecione Adicionais" : "Selecione Remoções";
    const opts = products.filter(p => p.category === "Adicionais");
    let html = `<form id="modForm">`;
    opts.forEach(o => {
      const currentQty =
        orderLines[lineIndex].additions.find(a => a.id === o.id)?.quantity || 1;
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0">
          <label>
            <input type="checkbox" value="${o.id}" name="mod" ${
        orderLines[lineIndex][type].some(m => m.id === o.id) ? "checked" : ""
      }/>
            ${o.name}
          </label>
          ${
            type === "additions"
              ? `<input id="qty-${o.id}" type="number" min="1" value="${currentQty}" style="width:40px"/>`
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
        ).map(el => Number(el.value));
        if (type === "additions") {
          return checked.map(id => ({
            id,
            quantity: Number(
              document.getElementById(`qty-${id}`)?.value || 1
            )
          }));
        }
        return checked;
      }
    });
    if (res.value !== undefined) {
      setOrderLines(lines => {
        const copy = [...lines];
        copy[lineIndex][type] = res.value;
        return copy;
      });
    }
  };

  const removeLine = i =>
    setOrderLines(lines => lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, v) =>
    setOrderLines(lines => {
      const copy = [...lines];
      copy[i][field] = v;
      return copy;
    });

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      app_id: 3,
      entity_name: "establishment",
      entity_id: +entityId,
      items: orderLines.map(l => ({
        item_id: l.product.id,
        quantity: l.quantity,
        additions: l.additions.flatMap(a => Array(a.quantity).fill(a.id)),
        removals: l.removals
      })),
      ...form
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
        html: `
          <style>
            .swal2-html-container { font-family: monospace; white-space: pre; text-align: left; }
          </style>
          <div class="print-area"><pre>${receiptText}</pre></div>
        `,
        showCancelButton: true,
        confirmButtonText: "Imprimir",
        cancelButtonText: "Fechar"
      }).then(res => {
        if (res.isConfirmed) {
          const w = window.open("", "_blank", "width=200,height=600");
          w.document.write(`
            <html>
              <head>
                <title>Recibo</title>
                <style>
                  @page { margin: 0; }
                  body { margin: 4px; font-family: monospace; font-size: 12px; }
                  pre { margin: 0; }
                </style>
              </head>
              <body><pre>${receiptText}</pre></body>
            </html>
          `);
          w.document.close();
          w.focus();
          w.print();
          w.close();
        }
      });
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire(
          "Erro",
          err.response?.data?.error || "Ocorreu um erro.",
          "error"
        );
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
        <h3>Novo Pedido</h3>
        <p className="text-center">
          <strong>{estName}</strong>
        </p>
        <Button variant="success" onClick={handleAddItem}>
          + Adicionar Item
        </Button>
        <Col md={6} className="m-2">
          {orderLines.map((line, i) => (
            <Card key={i} className="m-2">
              <Card.Header className="d-flex justify-content-between bg-warning text-dark">
                {line.product.name}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeLine(i)}
                >
                  X
                </Button>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={4}>
                    <Form.Control
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={e =>
                        updateLine(i, "quantity", +e.target.value)
                      }
                    />
                  </Col>
                  <Col md={4}>
                    <Button onClick={() => handleManage(i, "additions")}>
                      Adicionais
                    </Button>
                  </Col>
                  <Col md={4}>
                    <Button onClick={() => handleManage(i, "removals")}>
                      Remoções
                    </Button>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col>
                    {line.additions.map(a => (
                      <Badge key={a.id} bg="info" className="me-1">
                        +{a.quantity}{" "}
                        {products.find(p => p.id === a.id)?.name}
                      </Badge>
                    ))}
                    {line.removals.map(id => (
                      <Badge key={id} bg="secondary" className="me-1">
                        -{products.find(p => p.id === id)?.name}
                      </Badge>
                    ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
        <Form onSubmit={handleSubmit} className="mt-3">
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={e =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Origem</Form.Label>
                <Form.Select
                  value={form.origin}
                  onChange={e =>
                    setForm({ ...form, origin: e.target.value })
                  }
                >
                  <option>WhatsApp</option>
                  <option>Balcão</option>
                  <option>Telefone</option>
                  <option>App</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Consumo</Form.Label>
                <Form.Select
                  value={form.fulfillment}
                  onChange={e =>
                    setForm({ ...form, fulfillment: e.target
                      .value })
                  }
                >
                  <option value="dine-in">Local</option>
                  <option value="take-away">Levar</option>
                  <option value="delivery">Delivery</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3 mt-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={e =>
                    setForm({ ...form, payment_status: e.target.value })
                  }
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="failed">Falhou</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Método Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_method}
                  onChange={e =>
                    setForm({ ...form, payment_method: e.target.value })
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
          <Form.Group className="mt-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={e =>
                setForm({ ...form, notes: e.target.value })
              }
            />
          </Form.Group>
          <Button
            type="submit"
            className="mt-3"
            disabled={submitting}
          >
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Criar Pedido"
            )}
          </Button>
        </Form>
      </Container>
    </>
  );
}

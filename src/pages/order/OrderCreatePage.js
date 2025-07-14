import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
  Modal
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

export default function OrderCreatePage() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [items, setItems] = useState([]);
  const [estName, setEstName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptText, setReceiptText] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    access_code: "",
    origin: "WhatsApp",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: ""
  });

  const [orderLines, setOrderLines] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const [itemsRes, estRes] = await Promise.all([
          axios.get(
            `${apiBaseUrl}/item?entity_name=establishment&entity_id=${entityId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setItems(itemsRes.data);
        setEstName(estRes.data.establishment.name.toUpperCase());
        setOrderLines(
          itemsRes.data.map(it => ({
            item_id: it.id,
            quantity: 0,
            additions: [],
            removals: []
          }))
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  useEffect(() => {
    if (showReceipt) setTimeout(() => window.print(), 300);
  }, [showReceipt]);

  const handleLineChange = (idx, field, value) => {
    const copy = [...orderLines];
    copy[idx][field] = value;
    setOrderLines(copy);
  };

  const buildReceipt = order => {
    const lines = [];
    lines.push("█".repeat(32));
    lines.push("        " + estName);
    lines.push("█".repeat(32));
    lines.push("");
    lines.push(`Pedido Nº: ${order.order_number}`);
    lines.push("");
    lines.push(
      `${order.origin} - ${order.fulfillment.replace("-", " ")}`
    );
    lines.push(
      new Date(order.order_datetime).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + " BRT"
    );
    lines.push("");
    lines.push(`Cliente: ${order.customer_name}`);
    lines.push("");
    lines.push("-".repeat(32));
    lines.push("        ITENS DO PEDIDO");
    lines.push("-".repeat(32));
    order.items.forEach(i => {
      const qty = i.quantity + "x";
      const name = i.item.name;
      const price = Number(i.unit_price)
        .toFixed(2)
        .replace(".", ",");
      const combos = i.modifiers.filter(
        m => m.modifier.name === "Combo"
      );
      const comboTag = combos.length ? " (Combo)" : "";
      lines.push(`${qty} ${name}...........R$${price}${comboTag}`);
      combos.forEach(() =>
        lines.push(`🔸 Combo...................R$12,00`)
      );
      i.modifiers
        .filter(
          m => m.type === "addition" && m.modifier.name !== "Combo"
        )
        .forEach(m =>
          lines.push(`[Adicional de ${m.modifier.name}]`)
        );
      i.modifiers
        .filter(m => m.type === "removal")
        .forEach(m =>
          lines.push(`[Sem ${m.modifier.name}]`)
        );
    });
    lines.push("-".repeat(44));
    const total = Number(order.total_price)
      .toFixed(2)
      .replace(".", ",");
    lines.push("TOTAL".padEnd(32, ".") + `R$${total}`);
    return lines.join("\n");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      app_id: 3,
      entity_name: "establishment",
      entity_id: +entityId,
      items: orderLines.filter(l => l.quantity > 0),
      ...form
    };
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${apiBaseUrl}/order`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReceiptText(buildReceipt(data.order));
      setShowReceipt(true);
    } catch (err) {
      const msgs = err.response?.data?.errors || {};
      Swal.fire("Erro", Object.values(msgs).flat().join("\n"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Carregando...
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Modal
        show={showReceipt}
        backdrop="static"
        keyboard={false}
        onHide={() => {
          setShowReceipt(false);
          navigate("/dashboard");
        }}
        size="lg"
      >
        <Modal.Body>
          <pre
            ref={printRef}
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: 14
            }}
          >
            {receiptText}
          </pre>
        </Modal.Body>
      </Modal>
      <Container className="mt-4">
        <h3>Novo Pedido</h3>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  value={form.customer_phone}
                  onChange={e =>
                    setForm({ ...form, customer_phone: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Código Acesso</Form.Label>
                <Form.Control
                  required
                  value={form.access_code}
                  onChange={e =>
                    setForm({ ...form, access_code: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Consumo</Form.Label>
                <Form.Select
                  value={form.fulfillment}
                  onChange={e =>
                    setForm({ ...form, fulfillment: e.target.value })
                  }
                >
                  <option value="dine-in">Local</option>
                  <option value="take-away">Levar</option>
                  <option value="delivery">Delivery</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
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
              <Form.Group className="mb-3">
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
                  <option>Transferência</option>
                  <option>Vale-refeição</option>
                  <option>Cheque</option>
                  <option>PayPal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <hr />
          {items.map((it, idx) => (
            <Card className="mb-3" key={it.id}>
              <Card.Header>
                {it.name} — R$ {Number(it.price).toFixed(2)}
              </Card.Header>
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2}>
                    <Form.Control
                      type="number"
                      min={0}
                      value={orderLines[idx].quantity}
                      onChange={e =>
                        handleLineChange(idx, "quantity", +e.target.value)
                      }
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label>Adições</Form.Label>
                    <Form.Select
                      multiple
                      value={orderLines[idx].additions}
                      onChange={e => {
                        const opts = Array.from(
                          e.target.selectedOptions
                        ).map(o => +o.value);
                        handleLineChange(idx, "additions", opts);
                      }}
                    >
                      {items.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5}>
                    <Form.Label>Remoções</Form.Label>
                    <Form.Select
                      multiple
                      value={orderLines[idx].removals}
                      onChange={e => {
                        const opts = Array.from(
                          e.target.selectedOptions
                        ).map(o => +o.value);
                        handleLineChange(idx, "removals", opts);
                      }}
                    >
                      {items.map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          <Form.Group className="mb-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" /> Enviando...
              </>
            ) : (
              "Criar Pedido"
            )}
          </Button>
        </Form>
      </Container>
    </>
  );
}

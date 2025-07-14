// OrderCreatePage completo com checkbox exclusivo para combos e adicionais com quantidade
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
  Modal,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

export default function OrderCreatePage() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [products, setProducts] = useState([]);
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
    notes: "",
  });

  const [orderLines, setOrderLines] = useState([]);
  const [modal, setModal] = useState({
    addItem: false,
    additionsIdx: null,
    removalsIdx: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
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
        setEstName(resEst.data.establishment.name.toUpperCase());
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entityId]);

  useEffect(() => {
    if (showReceipt) setTimeout(() => window.print(), 300);
  }, [showReceipt]);

  const openAddItem = () => setModal((m) => ({ ...m, addItem: true }));
  const closeAddItem = () => setModal((m) => ({ ...m, addItem: false }));
  const openAdditions = (idx) => setModal((m) => ({ ...m, additionsIdx: idx }));
  const closeAdditions = () => setModal((m) => ({ ...m, additionsIdx: null }));
  const openRemovals = (idx) => setModal((m) => ({ ...m, removalsIdx: idx }));
  const closeRemovals = () => setModal((m) => ({ ...m, removalsIdx: null }));

  const addLine = (product) => {
    setOrderLines((lines) => [
      ...lines,
      { product, quantity: 1, additions: [], removals: [] },
    ]);
    closeAddItem();
  };

  const removeLine = (idx) =>
    setOrderLines((lines) => lines.filter((_, i) => i !== idx));

  const updateLine = (idx, field, value) => {
    setOrderLines((lines) => {
      const copy = [...lines];
      copy[idx][field] = value;
      return copy;
    });
  };

  // Substitua o trecho do buildReceipt por este:

  const buildReceipt = (order) => {
    const padLine = (left, right, width = 44) => {
      const dots = ".".repeat(
        Math.max(width - (left.length + right.length), 0)
      );
      return `${left}${dots}${right}`;
    };

    const formatMoney = (value) =>
      `R$${Number(value).toFixed(2).replace(".", ",")}`;

    const L = [];
    L.push("\u2588".repeat(40));
    L.push(`        ${estName}`);
    L.push("\u2588".repeat(40));
    L.push("");
    L.push(`Pedido Nº: ${String(order.order_number).padStart(3, "0")}`);
    L.push("");
    L.push(`${order.origin} - ${order.fulfillment.replace("-", " ")}`);
    L.push(
      new Date(order.order_datetime).toLocaleString("pt-BR", {
        hour12: false,
      }) + " BRT"
    );
    L.push("");
    L.push(`Cliente: ${order.customer_name}`);
    L.push("");
    L.push("-".repeat(40));
    L.push("        ITENS DO PEDIDO");
    L.push("-".repeat(40));

    order.items.forEach((i) => {
      const qty = `${i.quantity}x`;
      const name = i?.item?.name || "Produto";
      const price = formatMoney(i?.subtotal || 0);
      const modifiers = Array.isArray(i?.modifiers) ? i.modifiers : [];

      const combo = modifiers.filter((m) => m?.modifier?.name === "Combo");
      const additions = modifiers.filter(
        (m) => m?.type === "addition" && m?.modifier?.name !== "Combo"
      );
      const removals = modifiers.filter((m) => m?.type === "removal");

      L.push(
        padLine(`${qty} ${name}`, price) + (combo.length ? " (Combo)" : "")
      );
      combo.forEach(() => L.push(padLine("🔸 Combo", formatMoney(12))));
      additions.forEach((m) =>
        L.push(`[Adicional de ${m.modifier?.name || "extra"}]`)
      );
      removals.forEach((m) =>
        L.push(`[Sem ${m.modifier?.name || "ingrediente"}]`)
      );
    });

    L.push("-".repeat(44));
    L.push(padLine("TOTAL", formatMoney(order.total_price)));

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
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReceiptText(buildReceipt(data.order));
      setShowReceipt(true);
    } catch (err) {
      const msgs = err.response?.data?.errors || {};
      Swal.fire("Erro", Object.values(msgs).flat().join("\n"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );

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
            style={{ fontFamily: "monospace", color: "#000" }}
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
              <Form.Group>
                <Form.Label>Cliente</Form.Label>
                <Form.Control
                  required
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm({ ...form, customer_name: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Telefone</Form.Label>
                <Form.Control
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm({ ...form, customer_phone: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Código Acesso</Form.Label>
                <Form.Control
                  required
                  value={form.access_code}
                  onChange={(e) =>
                    setForm({ ...form, access_code: e.target.value })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Origem</Form.Label>
                <Form.Select
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                >
                  <option>WhatsApp</option>
                  <option>Balcão</option>
                  <option>Telefone</option>
                  <option>App</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Consumo</Form.Label>
                <Form.Select
                  value={form.fulfillment}
                  onChange={(e) =>
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
          <Row className="mt-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status Pagamento</Form.Label>
                <Form.Select
                  value={form.payment_status}
                  onChange={(e) =>
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
                  onChange={(e) =>
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
          <Button variant="success" onClick={openAddItem}>
            + Adicionar Item
          </Button>
          {orderLines.map((line, idx) => (
            <Card key={idx} className="mt-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                {line.product.name}{" "}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeLine(idx)}
                >
                  X
                </Button>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={2}>
                    <Form.Control
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(idx, "quantity", +e.target.value)
                      }
                    />
                  </Col>
                  <Col md={5}>
                    <Button onClick={() => openAdditions(idx)}>
                      Adicionais
                    </Button>
                  </Col>
                  <Col md={5}>
                    <Button onClick={() => openRemovals(idx)}>Remoções</Button>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col>
                    {line.additions.map((add) => (
                      <Badge bg="info" key={add.id}>
                        +{add.quantity}{" "}
                        {products.find((p) => p.id === add.id)?.name}
                      </Badge>
                    ))}
                    {line.removals.map((id) => (
                      <Badge bg="secondary" key={id}>
                        - {products.find((p) => p.id === id)?.name}
                      </Badge>
                    ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          <Form.Group className="mt-3">
            <Form.Label>Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Form.Group>
          <Button type="submit" className="mt-2" disabled={submitting}>
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Criar Pedido"
            )}
          </Button>
        </Form>
      </Container>

      <Modal show={modal.addItem} onHide={closeAddItem}>
        <Modal.Header closeButton>
          <Modal.Title>Escolha Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {products.map((p) => (
            <Button
              key={p.id}
              className="w-100 mb-2"
              onClick={() => addLine(p)}
            >
              {p.name} — R$ {Number(p.price).toFixed(2)}
            </Button>
          ))}
        </Modal.Body>
      </Modal>

      <Modal
        show={modal.additionsIdx !== null}
        onHide={closeAdditions}
        className="bg-dark text-white"
      >
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Selecione Adicionais</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <h5>Combo</h5>
          {products
            .filter(
              (p) => p.category === "Adicionais" && p.subcategory === "Combos"
            )
            .map((opt) => {
              const current = orderLines[modal.additionsIdx]?.additions || [];
              const isChecked = current.some((a) => a.id === opt.id);
              return (
                <Form.Check
                  key={opt.id}
                  type="checkbox"
                  label={opt.name}
                  className="mb-2"
                  checked={isChecked}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...current, { id: opt.id, quantity: 1 }]
                      : current.filter((a) => a.id !== opt.id);
                    updateLine(modal.additionsIdx, "additions", updated);
                  }}
                />
              );
            })}

          <h5 className="mt-4">Outros</h5>
          {products
            .filter(
              (p) => p.category === "Adicionais" && p.subcategory !== "Combos"
            )
            .map((opt) => {
              const current = orderLines[modal.additionsIdx]?.additions || [];
              const found = current.find((a) => a.id === opt.id);
              const qty = found?.quantity || 0;
              return (
                <div
                  key={opt.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <div>{opt.name}</div>
                  <div className="d-flex align-items-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        const updated =
                          qty > 0
                            ? current.map((a) =>
                                a.id === opt.id
                                  ? { ...a, quantity: qty - 1 }
                                  : a
                              )
                            : current;
                        updateLine(
                          modal.additionsIdx,
                          "additions",
                          updated.filter((a) => a.quantity > 0)
                        );
                      }}
                    >
                      -
                    </Button>
                    <span className="mx-2">{qty}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const exists = current.find((a) => a.id === opt.id);
                        const updated = exists
                          ? current.map((a) =>
                              a.id === opt.id ? { ...a, quantity: qty + 1 } : a
                            )
                          : [...current, { id: opt.id, quantity: 1 }];
                        updateLine(modal.additionsIdx, "additions", updated);
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
        </Modal.Body>
      </Modal>

      <Modal show={modal.removalsIdx !== null} onHide={closeRemovals}>
        <Modal.Header closeButton>
          <Modal.Title>Selecione Remoções</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {products
            .filter((p) => p.category === "Vegetais")
            .map((opt) => (
              <Form.Check
                key={opt.id}
                type="checkbox"
                label={opt.name}
                checked={
                  orderLines[modal.removalsIdx]?.removals.includes(opt.id) ||
                  false
                }
                onChange={(e) => {
                  const current = orderLines[modal.removalsIdx].removals;
                  const updated = e.target.checked
                    ? [...current, opt.id]
                    : current.filter((i) => i !== opt.id);
                  updateLine(modal.removalsIdx, "removals", updated);
                }}
              />
            ))}
        </Modal.Body>
      </Modal>
    </>
  );
}

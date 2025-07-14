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

const OrderCreatePage = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [items, setItems] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptText, setReceiptText] = useState("");

  // carrega itens
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/item?entity_name=establishment&entity_id=${entityId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setItems(data);
        setOrderLines(
          data.map(it => ({
            item_id: it.id,
            quantity: 0,
            additions: [],
            removals: []
          }))
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar itens.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  // quando showReceipt muda pra true, dispara impressão
  useEffect(() => {
    if (showReceipt) {
      setTimeout(() => window.print(), 300);
    }
  }, [showReceipt]);

  const handleLineChange = (idx, field, value) => {
    const lines = [...orderLines];
    lines[idx][field] = value;
    setOrderLines(lines);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      app_id: 3,
      entity_name: "establishment",
      entity_id: parseInt(entityId, 10),
      items: orderLines.filter(l => l.quantity > 0),
      ...form
    };

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      setReceiptText(data.receipt);
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
        <Spinner animation="border" /> Carregando itens...
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />

      {/* Modal de Nota */}
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
          <div
            ref={printRef}
            style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "14px" }}
          >
            {receiptText}
          </div>
        </Modal.Body>
      </Modal>

      {/* Formulário */}
      <Container className="mt-4">
        <h3>Novo Pedido</h3>
        <Form onSubmit={handleSubmit}>
          {/* campos de cliente, acesso, origem, etc */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Cliente</Form.Label>
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

          {/* acesso, origem, consumo */}
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Código de Acesso</Form.Label>
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
                  <option value="dine-in">Na loja</option>
                  <option value="take-away">Para levar</option>
                  <option value="delivery">Delivery</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* pagamento */}
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
                  <option>Transferência bancária</option>
                  <option>Vale-refeição</option>
                  <option>Cheque</option>
                  <option>PayPal</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <hr />

          {/* itens */}
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
                      value={orderLines[idx]?.quantity || 0}
                      onChange={e =>
                        handleLineChange(idx, "quantity", +e.target.value)
                      }
                    />
                  </Col>
                  <Col md={5}>
                    <Form.Label>Adições</Form.Label>
                    <Form.Select
                      multiple
                      value={orderLines[idx]?.additions}
                      onChange={e => {
                        const opts = Array.from(
                          e.target.selectedOptions
                        ).map(o => +o.value);
                        handleLineChange(idx, "additions", opts);
                      }}
                    >
                      {items.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={5}>
                    <Form.Label>Remoções</Form.Label>
                    <Form.Select
                      multiple
                      value={orderLines[idx]?.removals}
                      onChange={e => {
                        const opts = Array.from(
                          e.target.selectedOptions
                        ).map(o => +o.value);
                        handleLineChange(idx, "removals", opts);
                      }}
                    >
                      {items.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
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
};

export default OrderCreatePage;

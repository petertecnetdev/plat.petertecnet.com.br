import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Form, Button, Spinner } from "react-bootstrap";
import "./OrderForm.css";


export default function OrderForm({ form, submitting, onChange, onSubmit }) {
  return (
    <Form onSubmit={onSubmit} className="order-create__form">

      <Row className="order-create__form-row">
        <Col md={6}>
          <Form.Group>
            <Form.Label className="order-create__label">Cliente</Form.Label>
            <Form.Control
              required
              value={form.customer_name}
              onChange={(e) => onChange("customer_name", e.target.value)}
              placeholder="Nome do cliente"
              className="order-create__input"
            />
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label className="order-create__label">Origem do Pedido</Form.Label>
            <Form.Select
              value={form.origin}
              onChange={(e) => onChange("origin", e.target.value)}
              className="order-create__select"
            >
              <option value="Balcão">Balcão</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Telefone">Telefone</option>
              <option value="App">App</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="order-create__form-row">
        <Col md={4}>
          <Form.Group>
            <Form.Label className="order-create__label">Tipo de Consumo</Form.Label>
            <Form.Select
              value={form.fulfillment}
              onChange={(e) => onChange("fulfillment", e.target.value)}
              className="order-create__select"
            >
              <option value="dine-in">Local</option>
              <option value="take-away">Levar</option>
              <option value="delivery">Delivery</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label className="order-create__label">Status Pagamento</Form.Label>
            <Form.Select
              value={form.payment_status}
              onChange={(e) => onChange("payment_status", e.target.value)}
              className="order-create__select"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="failed">Falhou</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col md={4}>
          <Form.Group>
            <Form.Label className="order-create__label">Método Pagamento</Form.Label>
            <Form.Select
              value={form.payment_method}
              onChange={(e) => onChange("payment_method", e.target.value)}
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
          <Form.Group>
            <Form.Label className="order-create__label">Observações</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Observações do pedido"
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
              className="order-create__textarea"
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="order-create__form-row">
        <Col className="d-flex justify-content-center">
          <Button
            type="submit"
            className="order-create__btn-submit"
            disabled={submitting}
          >
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Criar Pedido"
            )}
          </Button>
        </Col>
      </Row>

    </Form>
  );
}

OrderForm.propTypes = {
  form: PropTypes.object.isRequired,
  submitting: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

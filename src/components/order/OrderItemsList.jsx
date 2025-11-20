// src/components/order/OrderItemsList.jsx
import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Button, Badge } from "react-bootstrap";
import "./OrderItemsList.css";

export default function OrderItemsList({ orderLines, onRemove, onQty, onModifiers }) {
  return (
    <div className="order-lines__block">
      <p className="order-lines__title">Itens do Pedido</p>

      <Row className="order-lines__list">
        {orderLines.map((line, index) => (
          <Row key={index} className="order-line__row">
            <Col xs={12} lg={4} className="order-line__product">
              <span className="order-line__product-name">
                {line.product.name} – R$ {Number(line.product.price)
                  .toFixed(2)
                  .replace(".", ",")}
              </span>

              <Button
                size="sm"
                variant="outline-danger"
                className="order-line__btn-remove"
                onClick={() => onRemove(index)}
              >
                ×
              </Button>
            </Col>

            <Col xs={12} sm={6} lg={2} className="order-line__quantity">
              <Button
                size="sm"
                variant="outline-info"
                className="order-line__btn-minus"
                onClick={() => onQty(index, "dec")}
              >
                −
              </Button>

              <span className="order-line__quantity-value">{line.quantity}</span>

              <Button
                size="sm"
                variant="outline-info"
                className="order-line__btn-plus"
                onClick={() => onQty(index, "inc")}
              >
                +
              </Button>
            </Col>

            <Col xs={12} sm={6} lg={3} className="order-line__modifiers">
              <Button
                size="sm"
                variant="outline-primary"
                className="order-line__btn-addition"
                onClick={() => onModifiers(index, "additions")}
              >
                Adicionais
              </Button>

              <Button
                size="sm"
                variant="outline-secondary"
                className="order-line__btn-removal"
                onClick={() => onModifiers(index, "removals")}
              >
                Remoções
              </Button>
            </Col>

            <div className="order-line__badges">
              {line.additions?.map((a) => (
                <Badge key={`add-${a.id}`} bg="success" className="order-line__badge-addition">
                  + {a.quantity}
                </Badge>
              ))}

              {line.removals?.map((id) => (
                <Badge key={`rem-${id}`} bg="danger" className="order-line__badge-removal">
                  − Remover
                </Badge>
              ))}
            </div>
          </Row>
        ))}
      </Row>
    </div>
  );
}

OrderItemsList.propTypes = {
  orderLines: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onQty: PropTypes.func.isRequired,
  onModifiers: PropTypes.func.isRequired
};

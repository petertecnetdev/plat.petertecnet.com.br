import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Button, Badge } from "react-bootstrap";
import "./OrderItemRow.css";

export default function OrderItemRow({
  index,
  line,
  products,
  onRemove,
  onQty,
  onModifiers
}) {
  return (
    <Row className="order-line__row">
      <Col xs={12} lg={4} className="order-line__product">
        <span className="order-line__product-name">
          {line.product.name} – R$ {line.product.price}
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
          onClick={() => onQty(index, "minus")}
        >
          −
        </Button>

        <span className="order-line__quantity-value">{line.quantity}</span>

        <Button
          size="sm"
          variant="outline-info"
          className="order-line__btn-plus"
          onClick={() => onQty(index, "plus")}
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
        {line.additions?.map((a) => {
          const p = products.find((x) => x.id === a.id);
          return (
            <Badge key={`add-${a.id}`} bg="success" className="order-line__badge-addition">
              + {a.quantity} {p?.name} – R$ {p?.price}
            </Badge>
          );
        })}

        {line.removals?.map((id) => {
          const p = products.find((x) => x.id === id);
          return (
            <Badge key={`rem-${id}`} bg="danger" className="order-line__badge-removal">
              − {p?.name}
            </Badge>
          );
        })}
      </div>
    </Row>
  );
}

OrderItemRow.propTypes = {
  index: PropTypes.number.isRequired,
  line: PropTypes.object.isRequired,
  products: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onQty: PropTypes.func.isRequired,
  onModifiers: PropTypes.func.isRequired
};

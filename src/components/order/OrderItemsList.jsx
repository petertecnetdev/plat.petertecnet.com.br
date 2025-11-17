import React from "react";
import PropTypes from "prop-types";
import { Row } from "react-bootstrap";
import OrderItemRow from "./OrderItemRow";
import "./OrderItemsList.css";

export default function OrderItemsList({
  orderLines,
  products,
  onRemove,
  onQty,
  onModifiers
}) {
  return (
    <div className="order-lines__block">
      <p className="order-lines__title">Itens do Pedido</p>

      <Row className="order-lines__list">
        {orderLines.map((line, i) => (
          <OrderItemRow
            key={i}
            index={i}
            line={line}
            products={products}
            onRemove={onRemove}
            onQty={onQty}
            onModifiers={onModifiers}
          />
        ))}
      </Row>
    </div>
  );
}

OrderItemsList.propTypes = {
  orderLines: PropTypes.array.isRequired,
  products: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onQty: PropTypes.func.isRequired,
  onModifiers: PropTypes.func.isRequired
};

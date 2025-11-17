import React from "react";
import PropTypes from "prop-types";

export default function OrderSummary({ formattedTotal }) {
  return (
    <div className="order-create__total">
      <h5>Total: {formattedTotal}</h5>
    </div>
  );
}

OrderSummary.propTypes = {
  formattedTotal: PropTypes.string.isRequired
};

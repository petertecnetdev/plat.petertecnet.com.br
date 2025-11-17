import React from "react";
import PropTypes from "prop-types";
import { storageUrl } from "../../config";
import { useNavigate } from "react-router-dom";
import "./OrderHeader.css";

export default function OrderHeader({ estName, estLogo, estId }) {
  const navigate = useNavigate();

  return (
    <div className="order-header__container">

      <div className="order-header__left">
        {estLogo ? (
          <img
            src={`${storageUrl}/${estLogo}`}
            alt={estName}
            className="order-header__logo"
            onError={(e) => (e.currentTarget.src = "/images/logo.png")}
          />
        ) : (
          <img
            src="/images/logo.png"
            alt="Logo"
            className="order-header__logo"
          />
        )}

        <h2 className="order-header__name">{estName}</h2>
      </div>

      <div className="order-header__right">
        <button
          className="order-header__btn"
          onClick={() => navigate(`/order/list/${estId}`)}
        >
          Ver Pedidos
        </button>
      </div>

    </div>
  );
}

OrderHeader.propTypes = {
  estName: PropTypes.string.isRequired,
  estLogo: PropTypes.string,
  estId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

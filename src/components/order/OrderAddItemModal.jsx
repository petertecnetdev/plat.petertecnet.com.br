import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./OrderAddItemModal.css";

export default function OrderAddItemModal({ products, onAddItem, onClose }) {
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);

  useEffect(() => {
    // 🔥 REMOVE SWEETALERT2 SE EXISTIR
    document.body.classList.remove("swal2-shown", "swal2-height-auto");
    document.documentElement.classList.remove("swal2-shown", "swal2-height-auto");
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    const leftovers = document.querySelectorAll(".swal2-container, .swal2-backdrop");
    leftovers.forEach((e) => e.remove());

    // 🔥 INICIA O MODAL BOOTSTRAP
    const el = modalRef.current;

    modalInstanceRef.current = new window.bootstrap.Modal(el, {
      backdrop: true,
      keyboard: true
    });

    modalInstanceRef.current.show();

    return () => {
      if (modalInstanceRef.current) {
        modalInstanceRef.current.hide();
      }
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((b) => b.remove());
    };
  }, []);

  const handleSelect = (id) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return;

    onAddItem({
      product: prod,
      quantity: 1,
      additions: [],
      removals: []
    });

    if (modalInstanceRef.current) modalInstanceRef.current.hide();

    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((b) => b.remove());

    onClose();
  };

  const handleClose = () => {
    if (modalInstanceRef.current) modalInstanceRef.current.hide();

    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((b) => b.remove());

    onClose();
  };

  return (
    <div ref={modalRef} className="modal fade" id="orderAddItemModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content order-modal">

          <div className="modal-header">
            <h5 className="modal-title">Adicionar Item</h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>

          <div className="modal-body row">
            {products.map((p) => (
              <div key={p.id} className="col-12 col-sm-6 col-md-3 mb-3">
                <div className="order-modal__item">
                  <span className="order-modal__item-name">{p.name}</span>
                  <span className="order-modal__item-price">
                    R$ {Number(p.price).toFixed(2).replace(".", ",")}
                  </span>

                  <button
                    className="order-modal__item-add"
                    onClick={() => handleSelect(p.id)}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

OrderAddItemModal.propTypes = {
  products: PropTypes.array.isRequired,
  onAddItem: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

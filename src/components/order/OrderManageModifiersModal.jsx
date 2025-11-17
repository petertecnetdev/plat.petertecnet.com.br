import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

export default function OrderManageModifiersModal({
  products,
  index,
  type,
  onClose
}) {
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);

  useEffect(() => {
    const el = modalRef.current;

    modalInstanceRef.current = new window.bootstrap.Modal(el, {
      backdrop: true,
      keyboard: true
    });

      useEffect(() => {
    // 🔥 REMOVE QUALQUER RESQUÍCIO DO SWEETALERT2
    document.body.classList.remove(
      "swal2-shown",
      "swal2-height-auto"
    );
    document.documentElement.classList.remove(
      "swal2-shown",
      "swal2-height-auto"
    );

    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";

    const oldBackdrops = document.querySelectorAll(".swal2-container, .swal2-backdrop");
    oldBackdrops.forEach((b) => b.remove());

    // 🔥 AGORA ABRE O BOOTSTRAP MODAL NORMALMENTE
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

    modalInstanceRef.current.show();

    return () => {
      if (modalInstanceRef.current) {
        modalInstanceRef.current.hide();
      }
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((b) => b.remove());
    };
  }, []);

    const handleClose = () => {
    if (modalInstanceRef.current) {
      modalInstanceRef.current.hide();
    }

    const backdrops = document.querySelectorAll(".modal-backdrop, .swal2-backdrop");
    backdrops.forEach((b) => b.remove());

    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";

    onClose();
  };

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="orderModifiersModal"
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content order-modal">

          <div className="modal-header">
            <h5 className="modal-title">
              {type === "additions" ? "Adicionais" : "Remoções"}
            </h5>
            <button type="button" className="btn-close" onClick={handleClose} />
          </div>

          <div className="modal-body row">
            {products.map((p) => (
              <div key={p.id} className="col-12 col-sm-6 col-md-3 mb-3">
                <div className="order-modal__item">
                  <span className="order-modal__item-name">{p.name}</span>

                  <button
                    className="order-modal__item-add"
                    data-id={p.id}
                    data-line={index}
                    data-type={type}
                  >
                    Selecionar
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

OrderManageModifiersModal.propTypes = {
  products: PropTypes.array.isRequired,
  index: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

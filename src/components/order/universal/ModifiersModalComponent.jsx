import { useEffect } from "react";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import "./ModifiersModalComponent.css";

export default function ModifiersModalComponent({
  products,
  initialAdditions,
  initialRemovals,
  mode, // "additions" | "removals"
  onSave,
  onClose,
}) {
  useEffect(() => {
    const additionsProducts = products.filter(
      (p) => String(p.category || "").toLowerCase() === "adicionais"
    );

    const selectedAdds = new Map(
      (mode === "additions" ? initialAdditions : []).map((a) => [
        a.id,
        a.quantity,
      ])
    );

    const selectedRems = new Set(
      mode === "removals" ? initialRemovals : []
    );

    const buildAdditionsGrid = () => {
      if (!additionsProducts.length)
        return `<div class="order-modal__empty">Nenhum adicional cadastrado.</div>`;

      return `
        <div class="container-fluid flex-grow-1 overflow-auto p-3">
          <div class="row order-modal__items-grid">
            ${additionsProducts
              .map((p) => {
                const qty = selectedAdds.get(p.id) || 0;
                return `
                  <div class="col-12 col-sm-6 col-md-3 mb-3">
                    <div class="order-modal__item">
                      <div class="order-modal__item-info">
                        <span class="order-modal__item-name">${p.name}</span>
                        <span class="order-modal__item-price">R$ ${Number(
                          p.price
                        )
                          .toFixed(2)
                          .replace(".", ",")}</span>
                      </div>

                      <div class="order-modal__qty">
                        <button class="order-modal__qty-btn" data-act="dec" data-id="${p.id}">−</button>
                        <span class="order-modal__qty-val" data-id="${p.id}">${qty}</span>
                        <button class="order-modal__qty-btn" data-act="inc" data-id="${p.id}">+</button>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="order-modal__footer">
          <button class="order-modal__swal-btn-cancel" data-close="1">Cancelar</button>
          <button class="order-modal__swal-btn" data-save="1">Salvar</button>
        </div>
      `;
    };

    const buildRemovalsGrid = () => {
      if (!additionsProducts.length)
        return `<div class="order-modal__empty">Nenhum item removível cadastrado.</div>`;

      return `
        <div class="container-fluid flex-grow-1 overflow-auto p-3">
          <div class="row order-modal__items-grid">
            ${additionsProducts
              .map((p) => {
                const on = selectedRems.has(p.id);
                return `
                  <div class="col-12 col-sm-6 col-md-3 mb-3">
                    <div class="order-modal__item">
                      <div class="order-modal__item-info">
                        <span class="order-modal__item-name">${p.name}</span>
                        <span class="order-modal__item-price">&nbsp;</span>
                      </div>

                      <button 
                        class="order-modal__toggle ${on ? "is-on" : ""}" 
                        data-id="${p.id}"
                      >
                        ${on ? "Remover ✓" : "Remover"}
                      </button>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <div class="order-modal__footer">
          <button class="order-modal__swal-btn-cancel" data-close="1">Cancelar</button>
          <button class="order-modal__swal-btn" data-save="1">Salvar</button>
        </div>
      `;
    };

    const html = `
      <div class="order-modal d-flex flex-column h-100">
        <div class="order-modal__category-title">
          ${mode === "additions" ? "Adicionais" : "Remoções"}
        </div>

        ${mode === "additions" ? buildAdditionsGrid() : buildRemovalsGrid()}
      </div>
    `;

    Swal.fire({
      html,
      showConfirmButton: false,
      background: "#000",
      width: "100vw",
      heightAuto: false,
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
      },
      didOpen: () => {
        const root = Swal.getHtmlContainer();

        root.addEventListener("click", (e) => {
          // -------------------
          // QUANTIDADE ADICIONAIS
          // -------------------
          const qtyBtn = e.target.closest(".order-modal__qty-btn");
          if (qtyBtn && mode === "additions") {
            const id = Number(qtyBtn.dataset.id);
            const action = qtyBtn.dataset.act;

            const current = selectedAdds.get(id) || 0;
            const next = Math.max(0, current + (action === "inc" ? 1 : -1));

            if (next === 0) selectedAdds.delete(id);
            else selectedAdds.set(id, next);

            const val = root.querySelector(
              `.order-modal__qty-val[data-id="${id}"]`
            );
            if (val) val.textContent = next;

            return;
          }

          // -------------------
          // TOGGLE REMOÇÕES
          // -------------------
          const toggle = e.target.closest(".order-modal__toggle");
          if (toggle && mode === "removals") {
            const id = Number(toggle.dataset.id);
            if (selectedRems.has(id)) selectedRems.delete(id);
            else selectedRems.add(id);

            toggle.classList.toggle("is-on");
            toggle.textContent = toggle.classList.contains("is-on")
              ? "Remover ✓"
              : "Remover";

            return;
          }

          // -------------------
          // CANCELAR
          // -------------------
          if (e.target.matches('[data-close="1"]')) {
            onClose();
            Swal.close();
            return;
          }

          // -------------------
          // SALVAR
          // -------------------
          if (e.target.matches('[data-save="1"]')) {
            if (mode === "additions") {
              const arr = Array.from(selectedAdds.entries()).map(
                ([id, quantity]) => ({
                  id,
                  quantity,
                })
              );
              onSave(arr);
            } else {
              const arr = Array.from(selectedRems.values());
              onSave(arr);
            }

            Swal.close();
          }
        });
      },
    });
  }, [
    products,
    initialAdditions,
    initialRemovals,
    mode,
    onSave,
    onClose,
  ]);

  return null;
}

ModifiersModalComponent.propTypes = {
  products: PropTypes.array.isRequired,
  initialAdditions: PropTypes.array,
  initialRemovals: PropTypes.array,
  mode: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

ModifiersModalComponent.defaultProps = {
  initialAdditions: [],
  initialRemovals: [],
};

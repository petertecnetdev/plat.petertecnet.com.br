import { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import "./ItemModalComponent.css";

export default function ItemModalComponent({ products, onSelect }) {
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    const categories = Array.from(
      new Set(products.map((p) => p.category || "Outros"))
    );

    let currentIndex = 0;
    let lastDirection = null;

    const getItemsHtml = (category) => {
      const items = products.filter((p) => (p.category || "Outros") === category);
      if (!items.length)
        return '<div class="order-modal__empty">Nenhum item nesta categoria.</div>';
      return items
        .map(
          (p) => `
        <div class="col-12 col-sm-6 col-md-3 mb-3">
          <div class="order-modal__item">
            <div class="order-modal__item-info">
              <span class="order-modal__item-name">${p.name}</span>
              <span class="order-modal__item-price">R$ ${Number(p.price)
                .toFixed(2)
                .replace(".", ",")}</span>
            </div>
            <button class="order-modal__item-add" data-id="${p.id}">Adicionar</button>
          </div>
        </div>
      `
        )
        .join("");
    };

    const getHtml = () => {
      const isMobile = window.innerWidth <= 600;
      const currentCat = categories[currentIndex];

      const transitionClass =
        lastDirection === "left"
          ? "order-modal__slide-left"
          : lastDirection === "right"
          ? "order-modal__slide-right"
          : "";

      return `
        <div class="order-modal d-flex flex-column h-100">

          ${
            isMobile
              ? `<div class="order-modal__category-title">${currentCat}</div>`
              : `
                <nav class="order-modal__tabs">
                  ${categories
                    .map(
                      (cat, idx) => `
                        <button
                          class="order-modal__tab${
                            idx === currentIndex ? " order-modal__tab--active" : ""
                          }"
                          data-cat-index="${idx}"
                        >${cat}</button>
                      `
                    )
                    .join("")}
                </nav>
              `
          }

          <div class="container-fluid flex-grow-1 overflow-auto p-3">
            <div class="row order-modal__items-grid ${transitionClass}">
              ${getItemsHtml(currentCat)}
            </div>
          </div>

        </div>
      `;
    };

    Swal.fire({
      html: getHtml(),
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      width: "100vw",
      heightAuto: false,
      background: "#000",
      padding: "0",
      customClass: {
        container: "order-modal__container-fullscreen",
        popup: "order-modal__swal-fullscreen",
        htmlContainer: "order-modal__content-fullscreen",
        cancelButton: "order-modal__swal-btn-cancel",
      },

      didOpen: () => {
        let startX = 0;
        let isTouching = false;
        const root = Swal.getHtmlContainer();

        root.addEventListener("touchstart", (e) => {
          const grid = root.querySelector(".order-modal__items-grid");
          if (!grid || !grid.contains(e.target)) return;
          isTouching = true;
          startX = e.touches[0].clientX;
        });

        root.addEventListener("touchend", (e) => {
          if (!isTouching) return;
          isTouching = false;

          const diff = e.changedTouches[0].clientX - startX;
          if (Math.abs(diff) < 40) return;

          if (diff < 0 && currentIndex < categories.length - 1) {
            lastDirection = "left";
            currentIndex += 1;
          } else if (diff > 0 && currentIndex > 0) {
            lastDirection = "right";
            currentIndex -= 1;
          } else if (diff < 0 && currentIndex === categories.length - 1) {
            lastDirection = "left";
            currentIndex = 0;
          } else if (diff > 0 && currentIndex === 0) {
            lastDirection = "right";
            currentIndex = categories.length - 1;
          }

          Swal.update({ html: getHtml() });
        });

        root.addEventListener("click", (e) => {
          const tab = e.target.closest(".order-modal__tab");
          if (tab) {
            lastDirection = null;
            currentIndex = Number(tab.dataset.catIndex);
            Swal.update({ html: getHtml() });
            return;
          }

          const addBtn = e.target.closest(".order-modal__item-add");
          if (addBtn) {
            const id = Number(addBtn.dataset.id);
            const prod = products.find((p) => p.id === id);
            if (!prod) return;

            onSelect(prod); // <-- dispara uma vez
            Swal.close();
          }
        });
      },
    });
  }, [products, onSelect]);

  return null;
}

ItemModalComponent.propTypes = {
  products: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};

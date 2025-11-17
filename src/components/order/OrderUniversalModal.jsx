import React, { useEffect, useRef, useState, useMemo } from "react";
import PropTypes from "prop-types";
import CategoryTabs from "./universal/CategoryTabs";
import ModifierGrid from "./universal/ModifierGrid";
import "./OrderUniversalModal.css";

export default function OrderUniversalModal({
  show,
  title,
  products,
  mode,
  onSelect,
  onSave,
  onClose,
}) {
  const modalRef = useRef(null);
  const modalInstanceRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("");
  const [selectedAdds, setSelectedAdds] = useState({});
  const [selectedRems, setSelectedRems] = useState({});

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category.trim()));
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    if (!activeCategory && categories.length) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => p.category === activeCategory)
      .sort((a, b) => Number(a.price) - Number(b.price));
  }, [products, activeCategory]);

  useEffect(() => {
    if (!show) return;

    document.body.style.overflow = "auto";

    modalInstanceRef.current = new window.bootstrap.Modal(modalRef.current, {
      backdrop: true,
      keyboard: true,
    });

    modalInstanceRef.current.show();

    return () => {
      modalInstanceRef.current?.hide();
      document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
      document.body.style.overflow = "auto";
    };
  }, [show]);

  const closeModal = () => {
    modalInstanceRef.current?.hide();
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    document.body.style.overflow = "auto";
    onClose();
  };

  const saveModifiers = () => {
    if (mode === "additions") {
      const arr = Object.entries(selectedAdds).map(([id, quantity]) => ({
        id: Number(id),
        quantity,
      }));
      onSave(arr);
    }

    if (mode === "removals") {
      const arr = Object.keys(selectedRems)
        .filter((id) => selectedRems[id])
        .map((id) => Number(id));
      onSave(arr);
    }

    closeModal();
  };

  return (
    <div ref={modalRef} className="modal fade" tabIndex="-1">
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content oum__modal">

          <div className="oum__body-header">
            <h5 className="oum__title">{title}</h5>
            <button className="oum__close-btn" onClick={closeModal}>×</button>
          </div>

          <CategoryTabs
            categories={categories}
            active={activeCategory}
            setActive={setActiveCategory}
          />

          <ModifierGrid
            mode={mode}
            items={filtered}
            selectedAdds={selectedAdds}
            selectedRems={selectedRems}
            setSelectedAdds={setSelectedAdds}
            setSelectedRems={setSelectedRems}
            onAddItem={onSelect}
            onClose={closeModal}
          />

          {(mode === "additions" || mode === "removals") && (
            <div className="oum__actions">
              <button className="oum__action-btn cancel" onClick={closeModal}>
                Cancelar
              </button>
              <button className="oum__action-btn save" onClick={saveModifiers}>
                Salvar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

OrderUniversalModal.propTypes = {
  show: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  products: PropTypes.array.isRequired,
  mode: PropTypes.oneOf(["add", "additions", "removals"]).isRequired,
  onSelect: PropTypes.func,
  onSave: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};

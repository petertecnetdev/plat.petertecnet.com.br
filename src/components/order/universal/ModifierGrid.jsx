import React from "react";
import PropTypes from "prop-types";

export default function ModifierGrid({
  mode,
  items,
  selectedAdds,
  selectedRems,
  setSelectedAdds,
  setSelectedRems,
  onAddItem,
}) {
  const changeQty = (id, inc) => {
    setSelectedAdds((prev) => {
      const next = (prev[id] || 0) + inc;
      if (next <= 0) {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      }
      return { ...prev, [id]: next };
    });
  };

  const toggleRemoval = (id) => {
    setSelectedRems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="modal-body row oum__body">
      {items.map((p) => (
        <div key={p.id} className="col-12 col-sm-6 col-md-3 mb-3">
          <div className="oum__item">
            <span className="oum__item-name">{p.name}</span>

            {mode !== "removals" && (
              <span className="oum__item-price">
                R$ {Number(p.price).toFixed(2).replace(".", ",")}
              </span>
            )}

            {mode === "add" && (
              <button
                className="oum__item-add"
                onClick={() =>
                  onAddItem({
                    product: p,
                    quantity: 1,
                    additions: [],
                    removals: [],
                  })
                }
              >
                Adicionar
              </button>
            )}

            {mode === "additions" && (
              <div className="oum__qty">
                <button
                  className="oum__qty-btn"
                  onClick={() => changeQty(p.id, -1)}
                >
                  −
                </button>

                <span className="oum__qty-val">
                  {selectedAdds[p.id] || 0}
                </span>

                <button
                  className="oum__qty-btn"
                  onClick={() => changeQty(p.id, +1)}
                >
                  +
                </button>
              </div>
            )}

            {mode === "removals" && (
              <button
                className={`oum__toggle ${selectedRems[p.id] ? "is-on" : ""}`}
                onClick={() => toggleRemoval(p.id)}
              >
                {selectedRems[p.id] ? "Remover ✓" : "Remover"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

ModifierGrid.propTypes = {
  mode: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  selectedAdds: PropTypes.object.isRequired,
  selectedRems: PropTypes.object.isRequired,
  setSelectedAdds: PropTypes.func.isRequired,
  setSelectedRems: PropTypes.func.isRequired,
  onAddItem: PropTypes.func.isRequired,
};

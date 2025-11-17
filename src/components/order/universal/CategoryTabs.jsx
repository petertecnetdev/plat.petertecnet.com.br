import React, { useRef } from "react";
import PropTypes from "prop-types";

export default function CategoryTabs({ categories, active, setActive }) {
  const tabsRef = useRef(null);
  const catRefs = useRef({});

  return (
    <div className="oum__tabs-wrapper">
      <button
        className="oum__scroll-left"
        onClick={() => (tabsRef.current.scrollLeft -= 120)}
      >
        ‹
      </button>

      <div ref={tabsRef} className="oum__categories">
        {categories.map((cat) => (
          <button
            key={cat}
            ref={(el) => (catRefs.current[cat] = el)}
            className={`oum__category-btn ${active === cat ? "active" : ""}`}
            onClick={() => setActive(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <button
        className="oum__scroll-right"
        onClick={() => (tabsRef.current.scrollLeft += 120)}
      >
        ›
      </button>
    </div>
  );
}

CategoryTabs.propTypes = {
  categories: PropTypes.array.isRequired,
  active: PropTypes.string.isRequired,
  setActive: PropTypes.func.isRequired,
};

// src/pages/establishment/EstablishmentViewPage.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import "./Establishment.css";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [est, setEst] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          config
        );
        setEst(data.establishment);
        const items = (data.items || []).filter(
          (i) => i.category?.toLowerCase() !== "adicionais"
        );
        const grouped = {};
        items.forEach((i) => {
          const c = i.category || "Outros";
          if (!grouped[c]) grouped[c] = [];
          grouped[c].push(i);
        });
        setMenu(grouped);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text:
            error.response?.data?.error ||
            "Falha ao carregar estabelecimento.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !est) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando...", "Aguarde..."]}
      />
    );
  }

  const categories = Object.keys(menu);
  const currentCategory = categories[currentIndex];
  const headerBg = est.background
    ? `${storageUrl}/${est.background}`
    : "/images/background.png";

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    const dx = touchEndX.current - touchStartX.current;
    if (dx > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (dx < -50 && currentIndex < categories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <>
      <NavlogComponent />
      <div className="establishment-page">
        <div
          className="header"
          style={{ backgroundImage: `url('${headerBg}')` }}
        >
          <div className="overlay" />
          <div className="header-content">
            <img
              src={
                est.logo
                  ? `${storageUrl}/${est.logo}`
                  : "/images/logo.png"
              }
              alt={est.name}
              className="logo"
            />
            <div className="header-info">
              <h1>{est.name}</h1>
              {est.fantasy && (
                <span className="subtitle">{est.fantasy}</span>
              )}
            </div>
          </div>
        </div>
        <div className="category-nav">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`cat-btn${i === currentIndex ? " active" : ""}`}
              onClick={() => setCurrentIndex(i)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div
          className="menu-container"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="category-section">
            <h2 className="category-title">{currentCategory}</h2>
            <div className="menu-list">
              {menu[currentCategory].map((item) => {
                const price = Number(item.price);
                const img = item.image
                  ? `${storageUrl}/${item.image}`
                  : est.logo
                  ? `${storageUrl}/${est.logo}`
                  : "/images/menu-placeholder.png";
                return (
                  <div key={item.id} className="menu-item-card">
                    <div className="menu-item-image">
                      <img
                        src={img}
                        alt={item.name}
                        onError={(e) =>
                          (e.target.src = "/images/menu-placeholder.png")
                        }
                      />
                    </div>
                    <div className="menu-item-info">
                      <h3 className="menu-item-title">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="menu-item-desc">
                          {item.description}
                        </p>
                      )}
                      <div className="menu-item-footer">
                        <span className="menu-item-price">
                          R$
                          {isNaN(price)
                            ? item.price
                            : price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          className="menu-item-action"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="footer-button">
          <button onClick={() => navigate(-1)}>← Voltar</button>
        </div>
      </div>
    </>
  );
}

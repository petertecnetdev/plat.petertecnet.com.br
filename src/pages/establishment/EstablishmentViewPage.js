import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [est, setEst] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setEst(data.establishment);
        const items = (data.items || []).filter(
          i => i.category?.toLowerCase() !== "adicionais"
        );
        const grouped = {};
        items.forEach(i => {
          const c = i.category || "Outros";
          if (!grouped[c]) grouped[c] = [];
          grouped[c].push(i);
        });
        setMenu(grouped);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: error.response?.data?.error || "Falha ao carregar estabelecimento.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !est) {
    return <ProcessingIndicatorComponent messages={["Carregando...", "Aguarde..."]} />;
  }

  const headerBg = est.background
    ? `${storageUrl}/${est.background}`
    : "/images/background.png";

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
              src={est.logo ? `${storageUrl}/${est.logo}` : "/images/logo.png"}
              alt={est.name}
              className="logo"
            />
            <div className="header-info">
              <h1>{est.name}</h1>
              {est.fantasy && <span className="subtitle">{est.fantasy}</span>}
            </div>
          </div>
        </div>

        <div className="menu-container">
          {Object.entries(menu).map(([category, items]) => (
            <div key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <div className="menu-list">
                {items.map(item => {
                  const price = Number(item.price);
                  const img =
                    item.image
                      ? `${storageUrl}/${item.image}`
                      : est.logo
                      ? `${storageUrl}/${est.logo}`
                      : "/images/menu-placeholder.png";
                  return (
                    <div key={item.id} className="menu-item">
                      <img
                        src={img}
                        onError={e => (e.target.src = "/images/menu-placeholder.png")}
                      />
                      <div className="menu-item-info">
                        <p className="item-name">{item.name}</p>
                        {item.description && <p>{item.description}</p>}
                        
                        <p className="item-name">R${item.price}</p>
                        <div className="bottom">
                          <span className="price">
                            R$ {isNaN(price) ? item.price : price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-button">
          <button onClick={() => navigate(-1)}>← Voltar</button>
        </div>
      </div>
    </>
  );
}

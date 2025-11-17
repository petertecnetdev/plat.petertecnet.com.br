import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Badge, Spinner } from "react-bootstrap";
import { FaInstagram, FaMapMarkerAlt, FaWhatsapp, FaFilePdf } from "react-icons/fa";
import "./Establishment.css";
import Swal from "sweetalert2";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`);
        setEstablishment(res.data.establishment);
        setItems(res.data.items || []);
      } catch {
        navigate("/404");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="establishment-root">
        <NavlogComponent />
        <div
          className="establishment-create-page d-flex justify-content-center align-items-center"
          style={{ minHeight: 400 }}
        >
          <Spinner animation="border" variant="warning" />
        </div>
      </div>
    );
  }

  if (!establishment) return null;

  const resolveImage = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${storageUrl || apiBaseUrl.replace("/api", "")}/${img.replace(/^\//, "")}`;
  };

  const groupByCategory = (arr) =>
    arr.reduce((acc, item) => {
      const cat = item.category || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});

  const cardapio = groupByCategory(items.filter((i) => i.status === 1 && i.type !== "modifier"));
  const phoneLink = establishment.phone ? `https://wa.me/55${establishment.phone.replace(/\D/g, "")}` : null;

const handleDownloadPdf = () => {
  const pdfUrl = `http://localhost/api.petertecnet.com.br/public/api/establishment/${slug}/menu/pdf`;
  window.open(pdfUrl, "_blank", "noopener,noreferrer");
};


  return (
    <div className="establishment-page-vitrine">
      <NavlogComponent />

      <div
        className="estab-hero"
        style={{
          background: `linear-gradient(90deg, rgba(18,18,18,0.87) 55%, rgba(36,36,36,0.70)), url('${resolveImage(
            establishment.background
          )}') center/cover no-repeat`,
        }}
      >
        <div className="estab-hero-inner">
          <div className="estab-logo-bubble">
            {establishment.logo && (
              <img src={resolveImage(establishment.logo)} alt="Logo" className="estab-logo" />
            )}
          </div>
          <div className="estab-info-block">
            <h1 className="estab-title">{establishment.name}</h1>
            {establishment.description && (
              <div className="estab-description">{establishment.description}</div>
            )}

            <div className="estab-actions d-flex flex-wrap align-items-center gap-3 mt-3">
              {establishment.instagram_url && (
                <a
                  href={establishment.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="estab-link"
                >
                  <FaInstagram /> Instagram
                </a>
              )}
              {phoneLink && (
                <a href={phoneLink} target="_blank" rel="noopener noreferrer" className="estab-link">
                  <FaWhatsapp /> WhatsApp
                </a>
              )}
              {establishment.location && (
                <a
                  href={establishment.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="estab-link"
                >
                  <FaMapMarkerAlt /> Como Chegar
                </a>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="estab-link"
                style={{
                  backgroundColor: "#B22222",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "600",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                <FaFilePdf /> Baixar Cardápio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="estab-details-row">
        <div>
          <b>Endereço: </b>
          {establishment.address
            ? `${establishment.address}${establishment.city ? " - " + establishment.city : ""}`
            : "–"}
        </div>
        <div>
          <b>Atende: </b>
          {(Array.isArray(establishment.segments)
            ? establishment.segments
            : establishment.segments
            ? JSON.parse(establishment.segments)
            : []
          ).map((seg) => (
            <Badge key={seg} bg="warning" text="dark" className="me-1">
              {seg}
            </Badge>
          ))}
        </div>
      </div>

      <section className="estab-cardapio-section">
        <h2 className="estab-cardapio-title">🍔 Cardápio</h2>
        {Object.keys(cardapio).length === 0 ? (
          <div className="estab-vazio">Nenhum item disponível no momento.</div>
        ) : (
          Object.entries(cardapio).map(([cat, prods]) => (
            <div key={cat} className="estab-cardapio-bloco">
              <h3 className="estab-cat-title">{cat}</h3>
              <div className="estab-items-grid">
                {prods.map((item) => (
                  <div
                    className={`estab-cardapio-card ${item.stock < 1 ? "estab-esgotado" : ""}`}
                    key={item.id}
                     onClick={() => {
    if (item && item.slug) {
      console.log("Navegando para slug:", item.slug);
      navigate(`/item/view/${item.slug}`);
    } else {
      console.warn("Slug ausente no produto:", item);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Este produto não possui slug válido.",
      });
    }
  }}
                  >
                    {item.image && (
                      <img src={resolveImage(item.image)} alt={item.name} className="estab-item-img" />
                    )}
                    <div className="estab-item-info">
                      <div className="estab-item-row">
                        <span className="estab-item-title">{item.name}</span>
                        {item.is_featured ? (
                          <Badge bg="warning" text="dark" className="ms-1">
                            Destaque
                          </Badge>
                        ) : null}
                      </div>
                      <div className="estab-item-desc">{item.description || <i>Sem descrição</i>}</div>
                      <div className="estab-item-bottom-row">
                        <span className="estab-item-preco">
                          {Number(item.price).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                        {item.stock > 0 ? (
                          <span className="estab-item-disponivel">Disponível</span>
                        ) : (
                          <span className="estab-item-indisponivel">Esgotado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

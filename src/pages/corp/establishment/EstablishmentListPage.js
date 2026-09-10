import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiBarChart2,
  FiEdit3,
  FiExternalLink,
  FiPackage,
  FiPlus,
  FiShare2,
  FiShoppingBag,
} from "react-icons/fi";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import { storageUrl } from "../../../config";
import { getMyEstablishments } from "../../../services/platCommerceApi";
import "../../establishment/Establishment.css";

const publicMenuUrl = (establishment, { attributed = false } = {}) => {
  const path = `/establishment/view/${encodeURIComponent(establishment.slug)}`;
  if (!attributed) return `${window.location.origin}${path}`;

  const query = new URLSearchParams({
    source: "shared-menu",
    ref: String(establishment.slug),
    utm_source: "plat",
    utm_medium: "product_share",
    utm_campaign: "menu_distribution",
  });

  return `${window.location.origin}${path}?${query.toString()}`;
};

export default function EstablishmentListPage() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const scopedEstablishments = await getMyEstablishments();
        if (active) setEstablishments(scopedEstablishments);
      } catch (error) {
        console.error("[Plat] Falha ao carregar estabelecimentos do contexto", error);
        if (!active) return;
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            error.response?.data?.message ||
            "Não foi possível carregar seus estabelecimentos da Plat.",
        });
        setEstablishments([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/images/logo.png";
  };

  const handleShare = async (establishment) => {
    const name = establishment.fantasy || establishment.name || "Cardápio";
    const url = publicMenuUrl(establishment, { attributed: true });
    const shareData = {
      title: `${name} na Plat`,
      text: `Veja o cardápio de ${name} e faça seu pedido online pela Plat.`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        await Swal.fire({
          icon: "success",
          title: "Link copiado",
          text: "O link público do cardápio está pronto para você compartilhar.",
          timer: 1800,
          showConfirmButton: false,
        });
        return;
      }

      await Swal.fire({
        icon: "info",
        title: "Compartilhe seu cardápio",
        text: url,
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      console.error("[Plat] Falha ao compartilhar página pública", error);
      Swal.fire({
        icon: "error",
        title: "Não foi possível compartilhar",
        text: "Abra a página pública e copie o endereço do navegador.",
      });
    }
  };

  return (
    <div className="establishment-root establishment-root--app">
      <NavlogComponent />

      <main className="establishment-list-page">
        <header className="establishment-page-header">
          <div>
            <span className="establishment-eyebrow">Gestão</span>
            <h1>Estabelecimentos</h1>
            <p>Gerencie exclusivamente as operações vinculadas à Plat.</p>
          </div>

          <Link to="/establishment/create" className="establishment-primary-action">
            <FiPlus />
            Novo estabelecimento
          </Link>
        </header>

        {isLoading ? (
          <ProcessingIndicatorComponent
            compact
            messages={["Carregando estabelecimentos…", "Preparando sua operação…"]}
          />
        ) : establishments.length === 0 ? (
          <section className="establishment-empty-state">
            <div className="establishment-empty-state__icon">
              <FiPackage />
            </div>
            <h2>Nenhum estabelecimento da Plat cadastrado</h2>
            <p>Cadastre sua primeira operação na Plat para começar a criar itens e receber pedidos.</p>
            <Link to="/establishment/create" className="establishment-primary-action">
              <FiPlus />
              Criar estabelecimento
            </Link>
          </section>
        ) : (
          <section className="establishment-grid">
            {establishments.map((establishment) => (
              <article className="establishment-card" key={establishment.id}>
                <div className="establishment-card__identity">
                  <img
                    src={`${storageUrl}/${establishment.logo || "logo.png"}`}
                    alt={establishment.name}
                    onError={handleLogoError}
                  />
                  <div>
                    <span className="establishment-card__status">
                      {establishment.is_published ? "Operação Plat ativa" : "Operação em preparação"}
                    </span>
                    <h2>{establishment.name}</h2>
                    <p>@{establishment.slug}</p>
                  </div>
                </div>

                <div className="establishment-card__actions">
                  <Link to={`/order/list/${establishment.id}`}>
                    <FiShoppingBag />
                    Pedidos
                  </Link>
                  <Link to={`/item/list/${establishment.slug}`}>
                    <FiPackage />
                    Itens
                  </Link>
                  <Link to={`/report/order/${establishment.id}`}>
                    <FiBarChart2 />
                    Relatórios
                  </Link>
                  <Link to={`/establishment/update/${establishment.id}`}>
                    <FiEdit3 />
                    Editar
                  </Link>
                  <Link to={`/establishment/view/${establishment.slug}`}>
                    <FiExternalLink />
                    {establishment.is_published ? "Página pública" : "Pré-visualizar página"}
                  </Link>
                  {establishment.is_published ? (
                    <button
                      type="button"
                      className="establishment-share-action"
                      onClick={() => handleShare(establishment)}
                      aria-label={`Compartilhar cardápio de ${establishment.fantasy || establishment.name}`}
                    >
                      <FiShare2 />
                      Compartilhar cardápio
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

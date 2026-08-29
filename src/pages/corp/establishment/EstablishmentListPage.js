import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiBarChart2,
  FiEdit3,
  FiExternalLink,
  FiPackage,
  FiPlus,
  FiShoppingBag,
} from "react-icons/fi";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import { apiV1BaseUrl, appId, storageUrl } from "../../../config";
import "../../establishment/Establishment.css";

export default function EstablishmentListPage() {
  const [establishments, setEstablishments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data: response } = await axios.get(`${apiV1BaseUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const scopedEstablishments = Array.isArray(response?.data?.establishments)
          ? response.data.establishments.filter(
              (establishment) => Number(establishment.app_id) === Number(appId)
            )
          : [];

        setEstablishments(scopedEstablishments);
      } catch (error) {
        console.error("[Plat] Falha ao carregar estabelecimentos do contexto", error);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            error.response?.data?.message ||
            "Não foi possível carregar seus estabelecimentos da Plat.",
        });
        setEstablishments([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogoError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = "/images/logo.png";
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
                    <span className="establishment-card__status">Operação Plat ativa</span>
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
                    Página pública
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

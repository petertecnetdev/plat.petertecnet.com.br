import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiHome, FiMap } from "react-icons/fi";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  return <main className="plat-not-found">
    <div className="plat-not-found__card">
      <img src="/images/plat-logo.svg" alt="" className="plat-not-found__logo"/>
      <span className="plat-not-found__code">404</span>
      <h1>Essa página não existe.</h1>
      <p>O endereço pode ter mudado ou estar incorreto. Você pode voltar para a Plat ou continuar procurando um restaurante.</p>
      <div className="plat-not-found__actions">
        <Link to="/" className="plat-not-found__primary"><FiHome/> Ir para o início</Link>
        <Link to="/restaurants"><FiMap/> Ver restaurantes</Link>
        <button type="button" onClick={() => window.history.back()}><FiArrowLeft/> Voltar</button>
      </div>
    </div>
  </main>;
}

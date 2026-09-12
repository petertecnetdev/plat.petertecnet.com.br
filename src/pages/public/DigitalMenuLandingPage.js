import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiGrid, FiShoppingBag, FiSmartphone, FiTrendingUp } from "react-icons/fi";
import { trackTelemetryEvent } from "../../telemetry";
import "../HomePage.css";

const benefits = [
  { icon: FiSmartphone, title: "Cardápio online", text: "Publique seus itens em uma página fácil de abrir no celular, sem depender de PDF ou atualização manual por mensagem." },
  { icon: FiGrid, title: "QR Code no salão", text: "Use o endereço público do estabelecimento no QR Code das mesas, balcão, embalagem e materiais do negócio." },
  { icon: FiShoppingBag, title: "Pedidos conectados", text: "Transforme quem consulta o cardápio em pedido dentro da mesma plataforma, com operação centralizada." },
  { icon: FiTrendingUp, title: "Estrutura para crescer", text: "Organize catálogo, operação e indicadores em uma base preparada para ampliar vendas sem trocar de sistema." },
];

const ATTRIBUTION_KEYS = [
  "source",
  "ref",
  "referral",
  "utm_source",
  "utm_medium",
  "utm_campaign",
];
const MAX_ATTRIBUTION_LENGTH = 120;

const readAttribution = () => {
  const incoming = new URLSearchParams(window.location.search);
  return ATTRIBUTION_KEYS.reduce((result, key) => {
    const value = String(incoming.get(key) || "").trim().slice(0, MAX_ATTRIBUTION_LENGTH);
    if (value) result[key] = value;
    return result;
  }, {});
};

const buildConversionTarget = (path) => {
  const attribution = readAttribution();
  const outgoing = new URLSearchParams(attribution);

  if (!outgoing.has("source")) outgoing.set("source", "cardapio-digital");

  return `${path}?${outgoing.toString()}`;
};

export default function DigitalMenuLandingPage() {
  const registerTarget = buildConversionTarget("/register");
  const plansTarget = buildConversionTarget("/planos");

  useEffect(() => {
    const attribution = readAttribution();
    trackTelemetryEvent("plat_high_intent_landing_viewed", {
      target: "digital_menu_landing",
      label: "Cardápio digital",
      metadata: {
        landing_path: window.location.pathname,
        source: attribution.source || "cardapio-digital",
        ref: attribution.ref || attribution.referral || null,
        utm_source: attribution.utm_source || null,
        utm_medium: attribution.utm_medium || null,
        utm_campaign: attribution.utm_campaign || null,
      },
    });
  }, []);

  const trackConversion = (action, destination, placement) => {
    const attribution = readAttribution();
    trackTelemetryEvent("plat_high_intent_landing_cta", {
      target: destination,
      label: action,
      metadata: {
        placement,
        destination,
        source: attribution.source || "cardapio-digital",
        ref: attribution.ref || attribution.referral || null,
        utm_source: attribution.utm_source || null,
        utm_medium: attribution.utm_medium || null,
        utm_campaign: attribution.utm_campaign || null,
      },
    });
  };

  return (
    <div className="plat-home">
      <header className="plat-home-nav">
        <Link to="/" className="plat-home-brand"><img src="/images/logo.png" alt="Plat" /><div><strong>PLAT</strong><span>by Peter Tecnet</span></div></Link>
        <nav>
          <Link to="/restaurants">Ver restaurantes</Link>
          <Link to={plansTarget} onClick={() => trackConversion("Ver planos", "/planos", "nav")}>Planos</Link>
          <Link to="/login" className="plat-home-login">Entrar</Link>
          <Link to={registerTarget} className="plat-home-cta" onClick={() => trackConversion("Criar cardápio", "/register", "nav")}>Criar cardápio</Link>
        </nav>
      </header>

      <main>
        <section className="plat-home-hero">
          <div className="plat-home-hero__copy">
            <span className="plat-home-kicker">Cardápio digital e QR Code para restaurantes, bares e operações de alimentação</span>
            <h1>Seu cardápio online, pronto para <em>receber pedidos.</em></h1>
            <p>Cadastre seu estabelecimento na Plat, organize os itens e publique uma página que seus clientes podem abrir pelo celular. Uma base simples para sair do cardápio estático e evoluir para pedidos e gestão.</p>
            <div className="plat-home-hero__actions">
              <Link to={registerTarget} className="plat-home-primary" onClick={() => trackConversion("Criar meu cardápio", "/register", "hero")}>Criar meu cardápio <FiArrowRight /></Link>
              <Link to={plansTarget} className="plat-home-secondary" onClick={() => trackConversion("Ver planos", "/planos", "hero")}>Ver planos</Link>
            </div>
            <div className="plat-home-trust">
              <span><FiCheckCircle /> Página pública</span>
              <span><FiCheckCircle /> Catálogo pelo celular</span>
              <span><FiCheckCircle /> Preparado para pedidos</span>
            </div>
          </div>

          <div className="plat-home-console" aria-hidden="true">
            <div className="plat-home-console__top"><span>Do QR Code ao pedido</span><b>Plat</b></div>
            <div className="plat-home-console__metrics">
              <div><span>01</span><strong>Cadastre</strong><small>Estabelecimento e itens</small></div>
              <div><span>02</span><strong>Compartilhe</strong><small>Link ou QR Code</small></div>
              <div><span>03</span><strong>Venda</strong><small>Converta visitas em pedidos</small></div>
            </div>
            <div className="plat-home-console__chart">{[34,42,48,55,63,69,75,81,87,91,96,100].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div>
            <div className="plat-home-console__footer"><FiTrendingUp /><span>Uma presença digital que acompanha o crescimento da operação.</span></div>
          </div>
        </section>

        <section className="plat-home-problem">
          <div><span>Menos atrito</span><h2>Não dependa de PDF desatualizado ou conversa manual para mostrar o que você vende.</h2></div>
          <p>Uma página pública centraliza itens, informações do estabelecimento e o caminho para o pedido. Você compartilha um único endereço e mantém o catálogo sob seu controle.</p>
        </section>

        <section className="plat-home-benefits" id="beneficios">
          <header><span>Feito para operação real</span><h2>Comece pelo cardápio e evolua sem reconstruir sua presença digital.</h2></header>
          <div className="plat-home-benefits__grid">{benefits.map(({icon:Icon,title,text})=><article key={title}><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="plat-home-flow">
          <div className="plat-home-flow__intro"><span>Comece agora</span><h2>Da criação da conta à publicação em poucos passos.</h2><p>O objetivo é colocar o estabelecimento online rapidamente e permitir que o próprio negócio distribua sua página.</p></div>
          <div className="plat-home-flow__steps">
            <div><b>01</b><h3>Crie sua conta</h3><p>Entre na Plat e cadastre o estabelecimento.</p></div>
            <div><b>02</b><h3>Adicione os itens</h3><p>Cadastre produtos, categorias, preços e informações úteis.</p></div>
            <div><b>03</b><h3>Publique o link</h3><p>Compartilhe no WhatsApp, Instagram, Google e QR Codes físicos.</p></div>
            <div><b>04</b><h3>Converta visitas</h3><p>Use a estrutura de pedidos e gestão da Plat conforme sua operação cresce.</p></div>
          </div>
        </section>

        <section className="plat-home-final">
          <img src="/images/logo.png" alt="Plat" />
          <span>PLAT • PETER TECNET</span>
          <h2>Coloque seu cardápio online e transforme acesso em oportunidade de venda.</h2>
          <p>Crie sua conta ou consulte os planos disponíveis para sua operação.</p>
          <div className="plat-home-hero__actions"><Link to={registerTarget} className="plat-home-primary" onClick={() => trackConversion("Criar cardápio", "/register", "final")}>Criar cardápio <FiArrowRight /></Link><Link to={plansTarget} className="plat-home-secondary" onClick={() => trackConversion("Ver planos", "/planos", "final")}>Ver planos</Link></div>
        </section>
      </main>
      <footer className="plat-home-footer"><span>© 2026 Peter Tecnet. Plat — cardápios, pedidos e gestão conectados.</span><Link to="/">Conhecer a Plat</Link></footer>
    </div>
  );
}

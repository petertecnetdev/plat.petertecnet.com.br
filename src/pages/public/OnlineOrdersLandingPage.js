import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiClock, FiShoppingBag, FiSmartphone, FiTrendingUp } from "react-icons/fi";
import "../HomePage.css";

const ATTRIBUTION_KEYS = ["source", "ref", "referral", "utm_source", "utm_medium", "utm_campaign"];
const MAX_ATTRIBUTION_LENGTH = 120;

const buildConversionTarget = (path) => {
  const incoming = new URLSearchParams(window.location.search);
  const outgoing = new URLSearchParams();
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = String(incoming.get(key) || "").trim().slice(0, MAX_ATTRIBUTION_LENGTH);
    if (value) outgoing.set(key, value);
  });
  if (!outgoing.has("source")) outgoing.set("source", "pedidos-online");
  return `${path}?${outgoing.toString()}`;
};

const benefits = [
  { icon: FiShoppingBag, title: "Pedido no mesmo fluxo", text: "Leve o cliente do cardápio ao pedido sem depender de mensagens soltas ou anotações manuais." },
  { icon: FiSmartphone, title: "Experiência mobile", text: "Disponibilize uma página pública simples para consultar itens e iniciar pedidos pelo celular." },
  { icon: FiClock, title: "Operação organizada", text: "Centralize pedidos e acompanhe o fluxo da operação em vez de distribuir informações em vários canais." },
  { icon: FiTrendingUp, title: "Base para vender mais", text: "Use catálogo, página pública e pedidos como uma estrutura digital que pode crescer junto com o estabelecimento." },
];

export default function OnlineOrdersLandingPage() {
  const registerTarget = buildConversionTarget("/register");
  const plansTarget = buildConversionTarget("/planos");

  return (
    <div className="plat-home">
      <header className="plat-home-nav">
        <Link to="/" className="plat-home-brand"><img src="/images/logo.png" alt="Plat" /><div><strong>PLAT</strong><span>by Peter Tecnet</span></div></Link>
        <nav><Link to="/cardapio-digital">Cardápio digital</Link><Link to={plansTarget}>Planos</Link><Link to="/login" className="plat-home-login">Entrar</Link><Link to={registerTarget} className="plat-home-cta">Começar</Link></nav>
      </header>
      <main>
        <section className="plat-home-hero">
          <div className="plat-home-hero__copy">
            <span className="plat-home-kicker">Pedidos online para restaurantes, bares e operações de alimentação</span>
            <h1>Transforme seu cardápio em um caminho simples para <em>receber pedidos online.</em></h1>
            <p>A Plat conecta estabelecimento, catálogo e pedidos em uma única experiência. Cadastre sua operação, publique os itens e crie um caminho digital para o cliente consultar e comprar sem depender de atendimento manual para cada pedido.</p>
            <div className="plat-home-hero__actions"><Link to={registerTarget} className="plat-home-primary">Começar a receber pedidos <FiArrowRight /></Link><Link to={plansTarget} className="plat-home-secondary">Ver planos</Link></div>
            <div className="plat-home-trust"><span><FiCheckCircle /> Página pública</span><span><FiCheckCircle /> Catálogo conectado</span><span><FiCheckCircle /> Gestão de pedidos</span></div>
          </div>
          <div className="plat-home-console" aria-hidden="true">
            <div className="plat-home-console__top"><span>Do acesso ao pedido</span><b>Plat</b></div>
            <div className="plat-home-console__metrics"><div><span>01</span><strong>Publique</strong><small>Itens e preços</small></div><div><span>02</span><strong>Compartilhe</strong><small>Link ou QR Code</small></div><div><span>03</span><strong>Receba</strong><small>Pedidos online</small></div></div>
            <div className="plat-home-console__chart">{[28,36,45,52,60,68,74,82,88,93,97,100].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div>
            <div className="plat-home-console__footer"><FiTrendingUp /><span>Menos atrito entre descobrir o cardápio e fazer o pedido.</span></div>
          </div>
        </section>
        <section className="plat-home-problem"><div><span>Venda sem conversa manual</span><h2>Seu cliente já está no celular. Dê a ele um caminho direto do item ao pedido.</h2></div><p>WhatsApp continua útil para relacionamento, mas não precisa ser a única forma de registrar cada venda. A Plat organiza a jornada para o estabelecimento operar de forma mais escalável.</p></section>
        <section className="plat-home-benefits"><header><span>Operação conectada</span><h2>Uma estrutura para captar pedidos e organizar o atendimento.</h2></header><div className="plat-home-benefits__grid">{benefits.map(({icon: Icon,title,text})=><article key={title}><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="plat-home-flow"><div className="plat-home-flow__intro"><span>Self-service</span><h2>Configure a operação e comece sem depender de implantação manual.</h2><p>Crie a conta, cadastre o estabelecimento e os itens, publique a página e distribua o endereço para seus clientes.</p></div><div className="plat-home-flow__steps"><div><b>01</b><h3>Crie a conta</h3><p>Cadastre-se na Plat.</p></div><div><b>02</b><h3>Monte o catálogo</h3><p>Adicione itens, preços e informações.</p></div><div><b>03</b><h3>Publique</h3><p>Compartilhe por link e QR Code.</p></div><div><b>04</b><h3>Receba pedidos</h3><p>Centralize o fluxo na operação.</p></div></div></section>
        <section className="plat-home-final"><img src="/images/logo.png" alt="Plat" /><span>PLAT • PETER TECNET</span><h2>Crie um canal próprio para transformar visitas em pedidos.</h2><p>Comece agora ou consulte o plano adequado para sua operação.</p><div className="plat-home-hero__actions"><Link to={registerTarget} className="plat-home-primary">Começar agora <FiArrowRight /></Link><Link to={plansTarget} className="plat-home-secondary">Ver planos</Link></div></section>
      </main>
      <footer className="plat-home-footer"><span>© 2026 Peter Tecnet. Plat — cardápios, pedidos e gestão conectados.</span><Link to="/cardapio-digital">Cardápio digital</Link></footer>
    </div>
  );
}

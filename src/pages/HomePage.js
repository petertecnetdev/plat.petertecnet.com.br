import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiBarChart2, FiCheckCircle, FiMapPin, FiSearch, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import "./HomePage.css";

const benefits = [
  { icon: FiSearch, title: "Descubra restaurantes", text: "Encontre restaurantes e operações disponíveis na Plat e acesse suas páginas públicas." },
  { icon: FiShoppingBag, title: "Peça pela própria Plat", text: "Veja o cardápio, escolha os itens e monte seu pedido diretamente na página do restaurante." },
  { icon: FiMapPin, title: "Informações em um só lugar", text: "Consulte endereço, canais de atendimento, formas de operação e informações do estabelecimento." },
  { icon: FiBarChart2, title: "Gestão para o restaurante", text: "Do outro lado, o estabelecimento administra pedidos, itens, atendimento e indicadores da operação." },
];

export default function HomePage() {
  return (
    <div className="plat-home">
      <header className="plat-home-nav">
        <Link to="/" className="plat-home-brand"><img src="/images/plat-logo.svg" alt="Plat" /><div><strong>PLAT</strong><span>by Peter Tecnet</span></div></Link>
        <nav>
          <Link to="/restaurants">Restaurantes</Link>
          <a href="#beneficios">Como funciona</a>
          <Link to="/login" className="plat-home-login">Entrar</Link>
          <Link to="/register" className="plat-home-cta">Sou restaurante</Link>
        </nav>
      </header>

      <main>
        <section className="plat-home-hero">
          <div className="plat-home-hero__copy">
            <span className="plat-home-kicker">Restaurantes, cardápios e pedidos em uma experiência conectada</span>
            <h1>Encontre. Escolha. <em>Peça pela Plat.</em></h1>
            <p>A Plat conecta clientes e restaurantes. Para o cliente, uma forma simples de descobrir estabelecimentos, conhecer o cardápio e pedir. Para o restaurante, uma plataforma completa para organizar a operação.</p>
            <div className="plat-home-hero__actions">
              <Link to="/restaurants" className="plat-home-primary">Ver restaurantes <FiArrowRight /></Link>
              <Link to="/register" className="plat-home-secondary">Cadastrar meu restaurante</Link>
            </div>
            <div className="plat-home-trust">
              <span><FiCheckCircle /> Restaurantes da Plat</span>
              <span><FiCheckCircle /> Cardápios online</span>
              <span><FiCheckCircle /> Gestão e pedidos conectados</span>
            </div>
          </div>

          <div className="plat-home-console" aria-hidden="true">
            <div className="plat-home-console__top"><span>Experiência conectada</span><b>Cliente + Restaurante</b></div>
            <div className="plat-home-console__metrics">
              <div><span>Descobrir</span><strong>Restaurantes</strong><small>Por cidade e categoria</small></div>
              <div><span>Escolher</span><strong>Cardápio</strong><small>Itens e preços</small></div>
              <div><span>Finalizar</span><strong>Pedido</strong><small>Direto na Plat</small></div>
            </div>
            <div className="plat-home-console__chart">{[36,58,44,70,63,86,74,94,78,91,88,100].map((height,index)=><i key={index} style={{height:`${height}%`}} />)}</div>
            <div className="plat-home-console__footer"><FiTrendingUp /><span>Uma plataforma para quem vende e para quem compra.</span></div>
          </div>
        </section>

        <section className="plat-home-problem">
          <div><span>Dois lados, uma plataforma</span><h2>A Plat não é apenas o painel do restaurante.</h2></div>
          <p>O cliente precisa encontrar o restaurante, entender a proposta, consultar o cardápio e iniciar o pedido. O restaurante recebe essa demanda e administra a operação no mesmo ecossistema.</p>
        </section>

        <section className="plat-home-benefits" id="beneficios">
          <header><span>Para clientes e restaurantes</span><h2>Uma jornada completa do primeiro acesso ao pedido.</h2></header>
          <div className="plat-home-benefits__grid">{benefits.map(({icon:Icon,title,text})=><article key={title}><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="plat-home-flow" id="como-funciona">
          <div className="plat-home-flow__intro"><span>Como funciona para o cliente</span><h2>Do restaurante ao pedido em poucos passos.</h2><p>A vitrine pública da Plat foi pensada para ser simples: descobrir, abrir, escolher e pedir.</p></div>
          <div className="plat-home-flow__steps">
            <div><b>01</b><h3>Encontre o restaurante</h3><p>Navegue pela listagem pública de operações da Plat.</p></div>
            <div><b>02</b><h3>Abra a página</h3><p>Veja informações, localização, canais e cardápio.</p></div>
            <div><b>03</b><h3>Escolha os itens</h3><p>Adicione produtos ao pedido diretamente na página.</p></div>
            <div><b>04</b><h3>Finalize</h3><p>Entre na sua conta e envie o pedido para o restaurante.</p></div>
          </div>
        </section>

        <section className="plat-home-purpose">
          <div><span>Para o restaurante</span><h2>A mesma Plat continua sendo uma ferramenta completa de gestão.</h2></div>
          <p>Estabelecimentos cadastrados administram itens, pedidos, atendimentos e relatórios em um painel separado da experiência pública do cliente.</p>
        </section>

        <section className="plat-home-final">
          <img src="/images/plat-logo.svg" alt="Plat" />
          <span>PLAT • PETER TECNET</span>
          <h2>Quer pedir ou quer vender? A Plat conecta os dois lados.</h2>
          <p>Explore restaurantes ou cadastre sua operação para começar.</p>
          <div className="plat-home-hero__actions"><Link to="/restaurants" className="plat-home-primary">Explorar restaurantes <FiArrowRight /></Link><Link to="/register" className="plat-home-secondary">Cadastrar restaurante</Link></div>
        </section>
      </main>
      <footer className="plat-home-footer"><span>© 2026 Peter Tecnet. Plat — clientes e restaurantes conectados.</span><Link to="/restaurants">Ver restaurantes</Link></footer>
    </div>
  );
}

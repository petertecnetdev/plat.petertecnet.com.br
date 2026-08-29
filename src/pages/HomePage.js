import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCheckCircle,
  FiClipboard,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import "./HomePage.css";

const benefits = [
  {
    icon: FiShoppingBag,
    title: "Pedidos organizados",
    text: "Centralize pedidos do salão, balcão, retirada e delivery em um fluxo operacional mais claro.",
  },
  {
    icon: FiPackage,
    title: "Itens sob controle",
    text: "Cadastre produtos, preços e informações da operação em um único ambiente de gestão.",
  },
  {
    icon: FiClipboard,
    title: "Atendimento registrado",
    text: "Mantenha o histórico dos atendimentos presenciais sem misturar execução com o fluxo comercial dos pedidos.",
  },
  {
    icon: FiBarChart2,
    title: "Decisões com dados",
    text: "Acompanhe volume de pedidos, faturamento, ticket médio e desempenho da sua operação.",
  },
];

export default function HomePage() {
  return (
    <div className="plat-home">
      <header className="plat-home-nav">
        <Link to="/" className="plat-home-brand">
          <img src="/images/logo.png" alt="Plat" />
          <div><strong>PLAT</strong><span>by Peter Tecnet</span></div>
        </Link>
        <nav>
          <a href="#beneficios">Benefícios</a>
          <a href="#como-funciona">Como funciona</a>
          <Link to="/login" className="plat-home-login">Entrar</Link>
          <Link to="/register" className="plat-home-cta">Começar agora</Link>
        </nav>
      </header>

      <main>
        <section className="plat-home-hero">
          <div className="plat-home-hero__copy">
            <span className="plat-home-kicker">Gestão para restaurantes e operações de alimentação</span>
            <h1>Mais controle da operação. <em>Menos improviso.</em></h1>
            <p>
              A Plat reúne pedidos, itens, atendimentos e indicadores em um só lugar para ajudar restaurantes a operar com mais organização, velocidade e visão do negócio.
            </p>
            <div className="plat-home-hero__actions">
              <Link to="/register" className="plat-home-primary">Criar minha operação <FiArrowRight /></Link>
              <Link to="/login" className="plat-home-secondary">Já tenho uma conta</Link>
            </div>
            <div className="plat-home-trust">
              <span><FiCheckCircle /> Operação centralizada</span>
              <span><FiCheckCircle /> Visão diária do negócio</span>
              <span><FiCheckCircle /> Interface simples e objetiva</span>
            </div>
          </div>

          <div className="plat-home-console" aria-hidden="true">
            <div className="plat-home-console__top"><span>Visão operacional</span><b>Hoje</b></div>
            <div className="plat-home-console__metrics">
              <div><span>Pedidos</span><strong>128</strong><small>+12,4%</small></div>
              <div><span>Faturamento</span><strong>R$ 8.420</strong><small>+8,7%</small></div>
              <div><span>Ticket médio</span><strong>R$ 65,78</strong><small>Operação saudável</small></div>
            </div>
            <div className="plat-home-console__chart">
              {[36,58,44,70,63,86,74,94,78,91,88,100].map((height, index) => <i key={index} style={{height:`${height}%`}} />)}
            </div>
            <div className="plat-home-console__footer"><FiTrendingUp /><span>Seu restaurante em uma visão clara e acionável.</span></div>
          </div>
        </section>

        <section className="plat-home-problem">
          <div><span>O problema</span><h2>Um restaurante perde eficiência quando cada parte da operação vive em um lugar diferente.</h2></div>
          <p>Pedidos anotados de formas diferentes, informações de itens espalhadas e falta de visão sobre o dia tornam decisões simples mais difíceis. A Plat nasce para concentrar essa rotina em uma plataforma operacional única.</p>
        </section>

        <section className="plat-home-benefits" id="beneficios">
          <header><span>Benefícios</span><h2>Uma base mais organizada para o restaurante crescer.</h2></header>
          <div className="plat-home-benefits__grid">
            {benefits.map(({icon:Icon,title,text}) => <article key={title}><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="plat-home-flow" id="como-funciona">
          <div className="plat-home-flow__intro"><span>Como funciona</span><h2>Da configuração à operação diária.</h2><p>A Plat foi pensada para reduzir atrito. Você configura seu estabelecimento, organiza os itens e passa a acompanhar a operação pelo mesmo ambiente.</p></div>
          <div className="plat-home-flow__steps">
            <div><b>01</b><h3>Cadastre o estabelecimento</h3><p>Configure os dados principais da sua operação e identidade.</p></div>
            <div><b>02</b><h3>Organize os itens</h3><p>Cadastre produtos, informações e preços usados no fluxo comercial.</p></div>
            <div><b>03</b><h3>Registre pedidos e atendimentos</h3><p>Separe o que é transação comercial do que é execução presencial.</p></div>
            <div><b>04</b><h3>Acompanhe os resultados</h3><p>Use métricas do dia para entender volume, faturamento e comportamento da operação.</p></div>
          </div>
        </section>

        <section className="plat-home-purpose">
          <div><span>O propósito da Plat</span><h2>Tecnologia que organiza a rotina para que o restaurante possa focar em servir melhor.</h2></div>
          <p>A Plat é uma plataforma Peter Tecnet criada para transformar processos operacionais em informação útil. O objetivo não é adicionar complexidade ao restaurante, mas retirar ruído: menos retrabalho, menos informação perdida e mais controle sobre o que acontece no negócio.</p>
        </section>

        <section className="plat-home-final">
          <img src="/images/logo.png" alt="Plat" />
          <span>PLAT • PETER TECNET</span>
          <h2>Coloque sua operação em uma plataforma feita para gestão.</h2>
          <p>Comece organizando seu estabelecimento e evolua a operação a partir de uma base única.</p>
          <Link to="/register" className="plat-home-primary">Começar agora <FiArrowRight /></Link>
        </section>
      </main>

      <footer className="plat-home-footer"><span>© 2026 Peter Tecnet. Plat — Gestão inteligente para operações.</span><Link to="/login">Acessar plataforma</Link></footer>
    </div>
  );
}

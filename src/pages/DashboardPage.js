import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { FiArrowRight, FiBarChart2, FiBriefcase, FiClipboard, FiDollarSign, FiEdit3, FiPlus, FiSettings, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getDashboardSummary } from "../services/platCommerceApi";
import { storageUrl } from "../config";
import "./Dashboard.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function DashboardPage() {
  const [data, setData] = useState({ totals: {}, establishments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboardSummary().then((result) => { if (active) setData(result); })
      .catch((error) => Swal.fire({ icon: "error", title: "Não foi possível carregar a operação", text: apiErrorMessage(error, "Tente novamente em instantes.") }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando sua operação…", "Calculando indicadores na API…"]}/>;
  const totals = data.totals || {};
  const rows = Array.isArray(data.establishments) ? data.establishments : [];
  const ordersChart = rows.map((row) => ({ label: row.establishment?.fantasy || row.establishment?.name || "Estabelecimento", value: Number(row.orders || 0) }));
  const revenueChart = rows.map((row) => ({ label: row.establishment?.fantasy || row.establishment?.name || "Estabelecimento", value: Number(row.revenue || 0) }));

  return <div className="dashboard-root"><NavlogComponent/><main className="dashboard-main">
    <header className="dashboard-hero"><div><span className="dashboard-eyebrow">Visão geral</span><h1>Operação Plat.</h1><p>Pedidos e receita calculados no servidor, exclusivamente para seus restaurantes da Plat.</p></div><div className="dashboard-hero__actions"><span className="dashboard-date">{new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</span><Link to="/establishment/create" className="dashboard-primary-action"><FiPlus/> Novo estabelecimento</Link></div></header>
    <section className="dashboard-kpis"><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-gold"><FiDollarSign/></span><div><span>Receita de hoje</span><strong>{money(totals.revenue)}</strong><small>Pedidos não cancelados</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-blue"><FiShoppingBag/></span><div><span>Pedidos hoje</span><strong>{totals.orders || 0}</strong><small>Atualizados pela API</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-green"><FiTrendingUp/></span><div><span>Ticket médio</span><strong>{money(totals.average_ticket)}</strong><small>Média de hoje</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-purple"><FiBriefcase/></span><div><span>Estabelecimentos</span><strong>{totals.establishments || 0}</strong><small>Vinculados à Plat</small></div></article></section>
    <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:"16px",marginBottom:"22px"}} aria-label="Análises visuais da operação"><peter-insight-chart type="bar" title="Pedidos por estabelecimento" subtitle="Compare rapidamente onde está concentrado o movimento de hoje." data={JSON.stringify(ordersChart)} primary-label="Pedidos hoje"/><peter-insight-chart type="bar" title="Receita por estabelecimento" subtitle="Receita de hoje calculada para cada estabelecimento da sua operação." data={JSON.stringify(revenueChart)} primary-label="Receita hoje" format="currency"/></section>
    <section className="dashboard-grid"><div className="dashboard-panel dashboard-panel--establishments"><div className="dashboard-panel__header"><div><span className="dashboard-eyebrow">Operação</span><h2>Estabelecimentos</h2></div><Link to="/establishment">Ver todos <FiArrowRight/></Link></div>
      {rows.length===0 ? <div className="dashboard-empty"><span><FiBriefcase/></span><h3>Sua operação na Plat começa aqui</h3><p>Cadastre seu primeiro restaurante para começar a vender.</p><Link to="/establishment/create"><FiPlus/> Criar estabelecimento</Link></div> : <div className="dashboard-establishments">{rows.map((row)=>{const est=row.establishment||{};return <article className="dashboard-establishment" key={est.id}><div className="dashboard-establishment__head"><img src={est.logo?`${storageUrl}/${est.logo}`:"/images/logo.png"} alt="" onError={(e)=>{e.currentTarget.src="/images/logo.png"}}/><div><h3>{est.fantasy||est.name}</h3><span>@{est.slug}</span></div></div><div className="dashboard-establishment__numbers"><div><span>Pedidos hoje</span><strong>{row.orders||0}</strong></div><div><span>Receita hoje</span><strong>{money(row.revenue)}</strong></div><div><span>Ticket médio</span><strong>{money(row.average_ticket)}</strong></div></div><div className="dashboard-establishment__actions"><Link to={`/order/list/${est.id}`}><FiShoppingBag/> Pedidos</Link><Link to={`/item/list/${est.slug}`}><FiClipboard/> Itens</Link><Link to={`/report/order/${est.id}`}><FiBarChart2/> Relatório</Link><Link to={`/establishment/${est.id}/ordering-settings`}><FiSettings/> Operação</Link><Link to={`/establishment/update/${est.id}`}><FiEdit3/> Editar</Link></div></article>})}</div>}
    </div><aside className="dashboard-side"><div className="dashboard-panel dashboard-summary"><span className="dashboard-eyebrow">Produção</span><h2>Fluxo essencial</h2><p>Cardápio → pedido → pagamento → preparo → conclusão. A tela de pedidos atualiza automaticamente.</p></div></aside></section>
  </main></div>;
}

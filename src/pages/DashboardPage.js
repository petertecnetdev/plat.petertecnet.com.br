import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FiArrowRight, FiBarChart2, FiBriefcase, FiClipboard, FiDollarSign, FiEdit3, FiPlus, FiSettings, FiShoppingBag, FiTrendingUp } from "react-icons/fi";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getDashboardSummary } from "../services/platCommerceApi";
import { createSubscriptionIntent, getRecoverableSubscriptionIntent } from "../services/subscriptionIntent";
import { storageUrl } from "../config";
import "./Dashboard.css";

const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const readPendingSubscription = () => {
  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    const selectedAt = pending?.selected_at ? Date.parse(pending.selected_at) : NaN;
    const isFresh = Number.isFinite(selectedAt) && Date.now() - selectedAt <= PENDING_TTL_MS;
    const plan = String(pending?.plan || "").trim().toLowerCase();

    if (pending?.application !== "plat" || !isFresh) return null;
    if (!/^[a-z0-9_-]{1,80}$/i.test(plan)) return null;

    return { ...pending, plan };
  } catch {
    return null;
  }
};

const pendingFromIntent = (intent) => {
  const plan = String(intent?.plan_code || "").trim().toLowerCase();
  if (!intent?.id || intent?.application !== "plat" || !/^[a-z0-9_-]{1,80}$/i.test(plan)) return null;

  return {
    application: "plat",
    plan,
    intent_id: intent.id,
    intent_status: intent.status,
    price_cents: intent.price_cents ?? null,
    currency: intent.currency || "BRL",
    source: intent.source || "subscription_plans",
    handoff: intent.handoff_channel || "app",
    referral: String(intent.metadata?.referral || "").trim(),
    campaign: String(intent.metadata?.campaign || "").trim(),
    selected_at: intent.created_at || new Date().toISOString(),
  };
};

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const planCode = String(searchParams.get("plan") || "").trim();
  const [data, setData] = useState({ totals: {}, establishments: [] });
  const [loading, setLoading] = useState(true);
  const [pendingSubscription, setPendingSubscription] = useState(() => readPendingSubscription());

  useEffect(() => {
    let active = true;
    getDashboardSummary().then((result) => { if (active) setData(result); })
      .catch((error) => Swal.fire({ icon: "error", title: "Não foi possível carregar a operação", text: apiErrorMessage(error, "Tente novamente em instantes.") }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const localPending = readPendingSubscription();
    if (localPending?.intent_id || /^[a-z0-9_-]{1,80}$/i.test(planCode)) return;

    let active = true;
    getRecoverableSubscriptionIntent().then((intent) => {
      if (!active) return;
      const recovered = pendingFromIntent(intent);
      if (!recovered) return;

      localStorage.setItem("pending_subscription_plan", JSON.stringify(recovered));
      setPendingSubscription(recovered);
    });

    return () => { active = false; };
  }, [planCode]);

  useEffect(() => {
    if (!/^[a-z0-9_-]{1,80}$/i.test(planCode)) return;

    const pending = readPendingSubscription();
    if (!pending || pending.plan !== planCode) return;
    if (pending.intent_id) {
      setPendingSubscription(pending);
      return;
    }

    let active = true;
    createSubscriptionIntent({
      planCode,
      priceCents: pending.price_cents ?? null,
      currency: pending.currency || "BRL",
      source: pending.source || "subscription_plans",
      referral: pending.referral || "",
      campaign: pending.campaign || "",
      handoff: pending.handoff || "app",
      page: window.location.pathname,
    }).then((intent) => {
      if (!active || !intent?.id) return;
      const nextPending = {
        ...pending,
        intent_id: intent.id,
        intent_status: intent.status,
        price_cents: intent.price_cents ?? pending.price_cents ?? null,
        currency: intent.currency || pending.currency || "BRL",
      };
      localStorage.setItem("pending_subscription_plan", JSON.stringify(nextPending));
      setPendingSubscription(nextPending);
    });

    return () => { active = false; };
  }, [planCode]);

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando sua operação…", "Calculando indicadores na API…"]}/>;
  const totals = data.totals || {};
  const rows = Array.isArray(data.establishments) ? data.establishments : [];
  const recoverablePayment = pendingSubscription?.intent_id ? pendingSubscription : null;
  const recoveryTarget = recoverablePayment
    ? `/planos?plan=${encodeURIComponent(recoverablePayment.plan)}&resume=1&source=payment_recovery`
    : "";

  return <div className="dashboard-root"><NavlogComponent/><main className="dashboard-main">
    <header className="dashboard-hero"><div><span className="dashboard-eyebrow">Visão geral</span><h1>Operação Plat.</h1><p>Pedidos e receita calculados no servidor, exclusivamente para seus restaurantes da Plat.</p></div><div className="dashboard-hero__actions"><span className="dashboard-date">{new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</span><Link to="/establishment/create" className="dashboard-primary-action"><FiPlus/> Novo estabelecimento</Link></div></header>
    {recoverablePayment && <section className="alert alert-warning d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4" role="status"><div><strong>Seu plano ainda está aguardando pagamento.</strong><div className="small mt-1">Continue de onde parou para ativar a assinatura sem iniciar uma nova contratação.</div></div><Link to={recoveryTarget} className="btn btn-dark flex-shrink-0">Continuar pagamento <FiArrowRight/></Link></section>}
    <section className="dashboard-kpis"><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-gold"><FiDollarSign/></span><div><span>Receita de hoje</span><strong>{money(totals.revenue)}</strong><small>Pedidos não cancelados</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-blue"><FiShoppingBag/></span><div><span>Pedidos hoje</span><strong>{totals.orders || 0}</strong><small>Atualizados pela API</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-green"><FiTrendingUp/></span><div><span>Ticket médio</span><strong>{money(totals.average_ticket)}</strong><small>Média de hoje</small></div></article><article className="dashboard-kpi"><span className="dashboard-kpi__icon is-purple"><FiBriefcase/></span><div><span>Estabelecimentos</span><strong>{totals.establishments || 0}</strong><small>Vinculados à Plat</small></div></article></section>
    <section className="dashboard-grid"><div className="dashboard-panel dashboard-panel--establishments"><div className="dashboard-panel__header"><div><span className="dashboard-eyebrow">Operação</span><h2>Estabelecimentos</h2></div><Link to="/establishment">Ver todos <FiArrowRight/></Link></div>
      {rows.length===0 ? <div className="dashboard-empty"><span><FiBriefcase/></span><h3>Sua operação na Plat começa aqui</h3><p>Cadastre seu primeiro restaurante para começar a vender.</p><Link to="/establishment/create"><FiPlus/> Criar estabelecimento</Link></div> : <div className="dashboard-establishments">{rows.map((row)=>{const est=row.establishment||{};return <article className="dashboard-establishment" key={est.id}><div className="dashboard-establishment__head"><img src={est.logo?`${storageUrl}/${est.logo}`:"/images/logo.png"} alt="" onError={(e)=>{e.currentTarget.src="/images/logo.png"}}/><div><h3>{est.fantasy||est.name}</h3><span>@{est.slug}</span></div></div><div className="dashboard-establishment__numbers"><div><span>Pedidos hoje</span><strong>{row.orders||0}</strong></div><div><span>Receita hoje</span><strong>{money(row.revenue)}</strong></div><div><span>Ticket médio</span><strong>{money(row.average_ticket)}</strong></div></div><div className="dashboard-establishment__actions"><Link to={`/order/list/${est.id}`}><FiShoppingBag/> Pedidos</Link><Link to={`/item/list/${est.slug}`}><FiClipboard/> Itens</Link><Link to={`/report/order/${est.id}`}><FiBarChart2/> Relatório</Link><Link to={`/establishment/${est.id}/ordering-settings`}><FiSettings/> Operação</Link><Link to={`/establishment/update/${est.id}`}><FiEdit3/> Editar</Link></div></article>})}</div>}
    </div><aside className="dashboard-side"><div className="dashboard-panel dashboard-summary"><span className="dashboard-eyebrow">Produção</span><h2>Fluxo essencial</h2><p>Cardápio → pedido → pagamento → preparo → conclusão. A tela de pedidos atualiza automaticamente.</p></div></aside></section>
  </main></div>;
}

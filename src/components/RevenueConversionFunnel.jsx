import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FiArrowRight, FiDollarSign, FiShare2, FiTrendingUp } from "react-icons/fi";
import { getEstablishmentRevenueFunnel, ORDERING_FUNNEL_EVENTS, PIX_FUNNEL_EVENTS } from "../services/revenueFunnel";

const LABELS = {
  plat_ordering_catalog_viewed: "Visitas",
  plat_ordering_item_added: "Carrinhos",
  plat_ordering_checkout_opened: "Checkouts",
  plat_ordering_checkout_submitted: "Enviados",
  plat_ordering_order_created: "Pedidos",
};

const PIX_LABELS = {
  frontend_pix_payment_ready: "PIX apresentados",
  frontend_pix_code_copied: "PIX copiados",
  frontend_payment_approved: "PIX aprovados",
};

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const percentage = (value, base) => (base > 0 ? Math.round((value / base) * 100) : 0);

const diagnose = (counts) => {
  const views = Number(counts.plat_ordering_catalog_viewed || 0);
  const adds = Number(counts.plat_ordering_item_added || 0);
  const checkout = Number(counts.plat_ordering_checkout_opened || 0);
  const submitted = Number(counts.plat_ordering_checkout_submitted || 0);
  const orders = Number(counts.plat_ordering_order_created || 0);

  if (views === 0) return { title: "Falta tráfego para o cardápio", text: "Compartilhe o link ou QR Code para trazer os primeiros compradores.", action: "share" };
  if (percentage(adds, views) < 12) return { title: "Muitas visitas, poucos carrinhos", text: "Revise foto, preço, disponibilidade e destaque dos itens mais vendáveis.", action: "items" };
  if (percentage(checkout, adds) < 35) return { title: "O carrinho está perdendo compradores", text: "Confira mínimo do pedido, taxas e opções de retirada/entrega.", action: "operation" };
  if (percentage(submitted, checkout) < 55) return { title: "Há abandono dentro do checkout", text: "Revise campos obrigatórios e formas de pagamento para reduzir fricção.", action: "operation" };
  if (percentage(orders, submitted) < 70) return { title: "Checkouts não estão virando pedidos", text: "Priorize pagamento, disponibilidade e erros operacionais: este é o vazamento mais próximo da receita.", action: "orders" };
  return { title: "Funil saudável", text: "Aumente distribuição e recorrência mantendo a conversão atual.", action: "share" };
};

export default function RevenueConversionFunnel({ establishment, averageTicket = 0 }) {
  const [funnel, setFunnel] = useState(null);
  const establishmentId = establishment && establishment.id;

  useEffect(() => {
    if (!establishmentId) return undefined;
    let active = true;
    getEstablishmentRevenueFunnel(establishmentId, 30)
      .then((result) => { if (active) setFunnel(result); })
      .catch(() => { if (active) setFunnel(null); });
    return () => { active = false; };
  }, [establishmentId]);

  if (!funnel) return null;

  const counts = funnel.counts || {};
  const diagnosis = diagnose(counts);
  const submitted = Number(counts.plat_ordering_checkout_submitted || 0);
  const orders = Number(counts.plat_ordering_order_created || 0);
  const confirmedTicket = Math.max(Number(averageTicket || 0), 0);
  const nearRevenueLosses = Math.max(submitted - orders, 0);
  const recoverableRevenueEstimate = nearRevenueLosses * confirmedTicket;
  const pixReady = Number(counts.frontend_pix_payment_ready || 0);
  const pixCopied = Number(counts.frontend_pix_code_copied || 0);
  const pixApproved = Number(counts.frontend_payment_approved || 0);
  const pixCopyLosses = Math.max(pixReady - pixCopied, 0);
  const pixPaymentLosses = Math.max(pixCopied - pixApproved, 0);
  const pixAtRiskCount = pixCopyLosses + pixPaymentLosses;
  const pixAtRiskEstimate = pixAtRiskCount * confirmedTicket;
  const pixLargestLeak = pixPaymentLosses >= pixCopyLosses
    ? { count: pixPaymentLosses, label: "PIX copiado, mas ainda não aprovado" }
    : { count: pixCopyLosses, label: "PIX apresentado, mas ainda não copiado" };
  const slug = encodeURIComponent(String(establishment?.slug || ""));
  const shareUrl = `${window.location.origin}/establishment/view/${slug}?source=merchant_funnel_recovery&utm_source=plat&utm_medium=dashboard&utm_campaign=revenue_funnel`;
  const name = String(establishment?.fantasy || establishment?.name || "seu estabelecimento").trim();
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Veja o cardápio de ${name}: ${shareUrl}`)}`;

  const action = diagnosis.action === "share"
    ? <a href={whatsappUrl} target="_blank" rel="noreferrer"><FiShare2/> Compartilhar agora</a>
    : diagnosis.action === "items"
      ? <Link to={`/item/list/${slug}`}>Melhorar itens <FiArrowRight/></Link>
      : diagnosis.action === "orders"
        ? <Link to={`/order/list/${establishmentId}`}>Ver pedidos <FiArrowRight/></Link>
        : <Link to={`/establishment/${establishmentId}/ordering-settings`}>Revisar operação <FiArrowRight/></Link>;

  return (
    <section className="dashboard-panel mb-4" aria-label="Funil de conversão dos últimos 30 dias">
      <div className="dashboard-panel__header">
        <div><span className="dashboard-eyebrow">Receita · últimos {funnel.days || 30} dias</span><h2>Onde você está perdendo vendas</h2></div>
        <FiTrendingUp/>
      </div>
      <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {ORDERING_FUNNEL_EVENTS.map((event, index) => {
          const current = Number(counts[event] || 0);
          const previous = index > 0 ? Number(counts[ORDERING_FUNNEL_EVENTS[index - 1]] || 0) : 0;
          return <div key={event} className="border rounded-3 p-3"><small className="d-block text-muted">{LABELS[event]}</small><strong className="fs-4">{current}</strong>{index > 0 && <small className="d-block">{percentage(current, previous)}% da etapa anterior</small>}</div>;
        })}
      </div>
      {PIX_FUNNEL_EVENTS.some((event) => Number(counts[event] || 0) > 0) && <div className="mt-4"><div className="d-flex justify-content-between align-items-end gap-3 mb-2"><div><span className="dashboard-eyebrow">Pagamento PIX</span><h3 className="h5 mb-0">Conversão até o dinheiro entrar</h3></div>{pixReady > 0 && <small className="text-muted">{percentage(pixApproved, pixReady)}% aprovado</small>}</div><div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>{PIX_FUNNEL_EVENTS.map((event, index) => { const current = Number(counts[event] || 0); const previous = index > 0 ? Number(counts[PIX_FUNNEL_EVENTS[index - 1]] || 0) : 0; return <div key={event} className="border rounded-3 p-3"><small className="d-block text-muted">{PIX_LABELS[event]}</small><strong className="fs-4">{current}</strong>{index > 0 && <small className="d-block">{percentage(current, previous)}% da etapa anterior</small>}</div>; })}</div>{pixAtRiskCount > 0 && <div className="alert alert-danger border mt-3 mb-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" role="status"><div><strong>{confirmedTicket > 0 ? `${money(pixAtRiskEstimate)} em PIX potencialmente em risco` : `${pixAtRiskCount} PIX com abandono antes da aprovação`}</strong><div className="small mt-1">Maior vazamento: {pixLargestLeak.count} {pixLargestLeak.label.toLowerCase()}. {confirmedTicket > 0 ? `Estimativa usa o ticket confirmado de ${money(confirmedTicket)} e não representa receita garantida.` : "Priorize estes pedidos porque estão mais próximos da receita."}</div></div><div className="dashboard-establishment__actions flex-shrink-0"><Link to={`/order/list/${establishmentId}`}>Recuperar pedidos <FiArrowRight/></Link></div></div>}</div>}
      {confirmedTicket > 0 && nearRevenueLosses > 0 && <div className="alert alert-warning border mt-3 mb-0 d-flex align-items-start gap-3" role="status"><FiDollarSign className="mt-1 flex-shrink-0"/><div><strong>{money(recoverableRevenueEstimate)} em receita potencial próxima da venda</strong><div className="small mt-1">Estimativa baseada em {nearRevenueLosses} checkout{nearRevenueLosses === 1 ? "" : "s"} enviado{nearRevenueLosses === 1 ? "" : "s"} que não virou{nearRevenueLosses === 1 ? "" : "aram"} pedido × ticket confirmado de {money(confirmedTicket)}. Use como prioridade de recuperação, não como receita garantida.</div></div></div>}
      <div className="alert alert-light border mt-3 mb-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><strong>{diagnosis.title}</strong><div className="small mt-1">{diagnosis.text}</div></div><div className="dashboard-establishment__actions flex-shrink-0">{action}</div></div>
    </section>
  );
}

RevenueConversionFunnel.propTypes = {
  establishment: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired, slug: PropTypes.string, fantasy: PropTypes.string, name: PropTypes.string }).isRequired,
  averageTicket: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

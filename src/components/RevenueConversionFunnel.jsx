import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiShare2, FiTrendingUp } from "react-icons/fi";
import { getEstablishmentRevenueFunnel, ORDERING_FUNNEL_EVENTS } from "../services/revenueFunnel";

const labels = {
  plat_ordering_catalog_viewed: "Visitas",
  plat_ordering_item_added: "Carrinhos",
  plat_ordering_checkout_opened: "Checkouts",
  plat_ordering_checkout_submitted: "Enviados",
  plat_ordering_order_created: "Pedidos",
};

const percentage = (value, base) => base > 0 ? Math.round((value / base) * 100) : 0;

const diagnose = (counts) => {
  const views = Number(counts.plat_ordering_catalog_viewed || 0);
  const adds = Number(counts.plat_ordering_item_added || 0);
  const checkout = Number(counts.plat_ordering_checkout_opened || 0);
  const submitted = Number(counts.plat_ordering_checkout_submitted || 0);
  const orders = Number(counts.plat_ordering_order_created || 0);

  if (views === 0) return { title: "Falta tráfego para o cardápio", text: "Compartilhe o link e o QR Code para começar a trazer compradores.", action: "share" };
  if (percentage(adds, views) < 12) return { title: "Visitantes não estão adicionando itens", text: "Revise foto, nome, preço, disponibilidade e destaque dos itens mais vendáveis.", action: "items" };
  if (percentage(checkout, adds) < 35) return { title: "O carrinho está perdendo compradores", text: "Confira mínimo do pedido, taxas, opções de retirada/entrega e clareza do carrinho.", action: "operation" };
  if (percentage(submitted, checkout) < 55) return { title: "Há abandono dentro do checkout", text: "Confira dados exigidos e formas de pagamento para reduzir fricção antes do envio.", action: "operation" };
  if (percentage(orders, submitted) < 70) return { title: "Checkouts enviados não viram pedidos", text: "Priorize pagamento, disponibilidade e erros operacionais: este é o vazamento mais próximo da receita.", action: "orders" };
  return { title: "Funil saudável", text: "Aumente distribuição e recorrência para multiplicar o volume mantendo a conversão atual.", action: "share" };
};

export default function RevenueConversionFunnel({ establishment }) {
  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    if (!establishment?.id) return undefined;
    let active = true;
    getEstablishmentRevenueFunnel(establishment.id, 30)
      .then((result) => { if (active) setFunnel(result); })
      .catch(() => { if (active) setFunnel(null); });
    return () => { active = false; };
  }, [establishment?.id]);

  const counts = funnel?.counts || {};
  const diagnosis = diagnose(counts);
  if (!funnel) return null;

  const slug = encodeURIComponent(String(establishment?.slug || ""));
  const shareUrl = `${window.location.origin}/establishment/view/${slug}?source=merchant_funnel_recovery&utm_source=plat&utm_medium=dashboard&utm_campaign=revenue_funnel`;
  const name = String(establishment?.fantasy || establishment?.name || "seu estabelecimento").trim();
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Veja o cardápio de ${name}: ${shareUrl}`)}`;
  const action = diagnosis.action === "share"
    ? <a href={whatsappUrl} target="_blank" rel="noreferrer"><FiShare2/> Compartilhar agora</a>
    : diagnosis.action === "items"
      ? <Link to={`/item/list/${slug}`}>Melhorar itens <FiArrowRight/></Link>
      : diagnosis.action === "orders"
        ? <Link to={`/order/list/${establishment.id}`}>Ver pedidos <FiArrowRight/></Link>
        : <Link to={`/establishment/${establishment.id}/ordering-settings`}>Revisar operação <FiArrowRight/></Link>;

  return <section className="dashboard-panel mb-4" aria-label="Funil de conversão dos últimos 30 dias">
    <div className="dashboard-panel__header"><div><span className="dashboard-eyebrow">Receita · últimos {funnel.days || 30} dias</span><h2>Onde você está perdendo vendas</h2></div><FiTrendingUp/></div>
    <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
      {ORDERING_FUNNEL_EVENTS.map((event, index) => {
        const current = Number(counts[event] || 0);
        const previous = index > 0 ? Number(counts[ORDERING_FUNNEL_EVENTS[index - 1]] || 0) : 0;
        return <div key={event} className="border rounded-3 p-3"><small className="d-block text-muted">{labels[event]}</small><strong className="fs-4">{current}</strong>{index > 0 && <small className="d-block">{percentage(current, previous)}% da etapa anterior</small>}</div>;
      })}
    </div>
    <div className="alert alert-light border mt-3 mb-0 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"><div><strong>{diagnosis.title}</strong><div className="small mt-1">{diagnosis.text}</div></div><div className="dashboard-establishment__actions flex-shrink-0">{action}</div></div>
  </section>;
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getMyOrders } from "../../services/platCommerceApi";
import Swal from "sweetalert2";
import "./CustomerOrders.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const labels = { pending: "Recebido", confirmed: "Confirmado", preparing: "Em preparo", ready: "Pronto", completed: "Concluído", cancelled: "Cancelado" };
const pendingPixStorageKey = "plat-pending-pix-order";
const isRecoverablePix = (order) =>
  order?.payment_method === "pix" &&
  order?.payment_status !== "paid" &&
  order?.status !== "cancelled";
const orderTrackingPath = (order) =>
  `/my-orders/${order.id}${isRecoverablePix(order) ? "?recovery_source=in_app" : ""}`;

const syncPendingPixRecovery = (orders) => {
  const recoverable = (orders || []).find(isRecoverablePix);
  if (!recoverable) {
    localStorage.removeItem(pendingPixStorageKey);
    return;
  }
  localStorage.setItem(pendingPixStorageKey, JSON.stringify({
    id: recoverable.id,
    order_number: recoverable.order_number || recoverable.id,
    establishment: recoverable.establishment?.fantasy || recoverable.establishment?.name || "Estabelecimento",
    amount: Number(recoverable.total_price || 0),
    saved_at: new Date().toISOString(),
  }));
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyOrders().then((page) => {
      if (!active) return;
      const nextOrders = Array.isArray(page?.data) ? page.data : [];
      setOrders(nextOrders);
      syncPendingPixRecovery(nextOrders);
    })
      .catch((error) => Swal.fire("Erro", apiErrorMessage(error, "Não foi possível carregar seus pedidos."), "error"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="plat-customer-orders"><NavlogComponent/><main className="plat-customer-orders__main">
    <header className="plat-customer-orders__head"><div><span className="plat-customer-orders__eyebrow">Sua conta</span><h1>Meus pedidos</h1></div><Link to="/restaurants">Encontrar restaurantes</Link></header>
    {loading ? <ProcessingIndicatorComponent compact messages={["Carregando seus pedidos…"]}/> : orders.length === 0 ? <section className="plat-empty-orders"><h2>Você ainda não fez pedidos na Plat</h2><p>Escolha um restaurante e faça seu primeiro pedido.</p><Link to="/restaurants">Ver restaurantes</Link></section> : <section className="plat-orders-list">{orders.map((order)=>{const recoverablePix=isRecoverablePix(order);return <Link className={`plat-order-card${recoverablePix ? " plat-order-card--payment-recovery" : ""}`} to={orderTrackingPath(order)} key={order.id}><div><h2>{order.establishment?.fantasy || order.establishment?.name || "Restaurante"} · #{order.order_number || order.id}</h2><p>{order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : ""}</p><span className="plat-status">{labels[order.status] || order.status}</span>{recoverablePix ? <p><strong>Pix pendente — toque para pagar agora sem refazer o pedido.</strong></p> : null}</div><div className="plat-order-card__amount"><strong>{money(order.total_price)}</strong><span>{order.payment_status === "paid" ? "Pago" : recoverablePix ? "Concluir Pix agora" : "Pagamento pendente"}</span></div></Link>;})}</section>}
  </main></div>;
}

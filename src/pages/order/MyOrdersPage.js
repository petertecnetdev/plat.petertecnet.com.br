import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getMyOrders } from "../../services/platCommerceApi";
import Swal from "sweetalert2";
import "./CustomerOrders.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const labels = { pending: "Recebido", confirmed: "Confirmado", preparing: "Em preparo", ready: "Pronto", completed: "Concluído", cancelled: "Cancelado" };

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMyOrders().then((page) => { if (active) setOrders(Array.isArray(page?.data) ? page.data : []); })
      .catch((error) => Swal.fire("Erro", apiErrorMessage(error, "Não foi possível carregar seus pedidos."), "error"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="plat-customer-orders"><NavlogComponent/><main className="plat-customer-orders__main">
    <header className="plat-customer-orders__head"><div><span className="plat-customer-orders__eyebrow">Sua conta</span><h1>Meus pedidos</h1></div><Link to="/restaurants">Encontrar restaurantes</Link></header>
    {loading ? <ProcessingIndicatorComponent compact messages={["Carregando seus pedidos…"]}/> : orders.length === 0 ? <section className="plat-empty-orders"><h2>Você ainda não fez pedidos na Plat</h2><p>Escolha um restaurante e faça seu primeiro pedido.</p><Link to="/restaurants">Ver restaurantes</Link></section> : <section className="plat-orders-list">{orders.map((order)=><Link className="plat-order-card" to={`/my-orders/${order.id}`} key={order.id}><div><h2>{order.establishment?.fantasy || order.establishment?.name || "Restaurante"} · #{order.order_number || order.id}</h2><p>{order.created_at ? new Date(order.created_at).toLocaleString("pt-BR") : ""}</p><span className="plat-status">{labels[order.status] || order.status}</span></div><div className="plat-order-card__amount"><strong>{money(order.total_price)}</strong><span>{order.payment_status === "paid" ? "Pago" : "Pagamento pendente"}</span></div></Link>)}</section>}
  </main></div>;
}

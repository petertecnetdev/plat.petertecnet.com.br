import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, trackGuestOrder } from "../../services/platCommerceApi";
import { readGuestOrder, rememberGuestOrderPhone } from "../../utils/guestOrderTracking";
import { trackTelemetryEvent } from "../../telemetry";
import "./CustomerOrders.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const stages = ["pending", "confirmed", "preparing", "ready", "completed"];
const labels = { pending: "Recebido", confirmed: "Confirmado", preparing: "Em preparo", ready: "Pronto", completed: "Concluído", cancelled: "Cancelado" };

export default function GuestOrderTrackingPage() {
  const { id } = useParams();
  const stored = useMemo(() => readGuestOrder(id), [id]);
  const [phone, setPhone] = useState(stored?.phone || "");
  const [credential, setCredential] = useState(stored?.phone || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(stored?.phone));
  const [refreshing, setRefreshing] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!credential) return undefined;
    let active = true;
    let timer;

    const load = async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const next = await trackGuestOrder(id, credential);
        if (!active) return;
        setOrder(next);
        rememberGuestOrderPhone(id, credential);
        if (!opened) {
          setOpened(true);
          trackTelemetryEvent("plat_guest_order_tracking_opened", {
            target: "guest_order",
            label: String(next?.order_number || next?.id || id),
            metadata: {
              order_id: next?.id || id,
              order_status: next?.status || null,
              payment_status: next?.payment_status || null,
              fulfillment: next?.fulfillment || null,
              amount: Number(next?.total_price || 0),
            },
          });
        }
      } catch (error) {
        if (!silent && active) {
          setOrder(null);
          setCredential("");
          Swal.fire("Não foi possível localizar", apiErrorMessage(error, "Confira o telefone usado no pedido e tente novamente."), "error");
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    timer = window.setInterval(() => load(true), 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id, credential, opened]);

  const submitPhone = (event) => {
    event.preventDefault();
    const normalized = String(phone || "").trim();
    if (!normalized) return;
    setCredential(normalized);
  };

  const currentIndex = stages.indexOf(order?.status);

  if (loading && credential && !order) return <ProcessingIndicatorComponent messages={["Localizando seu pedido…"]}/>;

  return <div className="plat-customer-orders"><NavlogComponent/><main className="plat-customer-orders__main plat-track">
    {!credential ? <section className="plat-track__summary" style={{maxWidth:620,margin:"40px auto"}}>
      <span className="plat-customer-orders__eyebrow">Acompanhamento seguro</span>
      <h1>Pedido #{stored?.order_number || id}</h1>
      <p>Informe o mesmo telefone usado no checkout para acompanhar o pedido sem criar uma conta.</p>
      <form onSubmit={submitPhone} style={{display:"grid",gap:12,marginTop:20}}>
        <label htmlFor="guest-order-phone"><strong>Telefone do pedido</strong></label>
        <input id="guest-order-phone" className="form-control" value={phone} onChange={(event)=>setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="(62) 99999-9999" required />
        <button type="submit" className="btn btn-primary">Acompanhar pedido</button>
      </form>
      <p style={{marginTop:16,fontSize:".9rem",opacity:.8}}>Por segurança, a Plat não exibe nome, telefone, endereço ou observações nesta página.</p>
    </section> : order ? <>
      <header className="plat-customer-orders__head"><div><span className="plat-customer-orders__eyebrow">Acompanhamento ao vivo</span><h1>Pedido #{order.order_number || order.id}</h1><p>{order.establishment?.fantasy || order.establishment?.name}</p></div>{order.establishment?.slug ? <Link to={`/establishment/view/${order.establishment.slug}`}>Voltar ao cardápio</Link> : null}</header>
      {order.status === "cancelled" ? <div className="plat-payment-box"><strong>Pedido cancelado</strong><p>Este pedido não seguirá para preparo. Fale com o estabelecimento se precisar de ajuda.</p></div> : <div className="plat-track__timeline">{stages.map((stage,index)=><div className={`plat-track__step${index <= currentIndex ? " is-active" : ""}`} key={stage}>{labels[stage]}</div>)}</div>}
      <section className="plat-track__summary">
        <div className="plat-track__row"><span>Status</span><strong>{labels[order.status] || order.status}</strong></div>
        <div className="plat-track__row"><span>Pagamento</span><strong>{order.payment_status === "paid" ? "Pago" : order.payment_method === "cash" ? "Pagamento no atendimento" : order.payment_method === "card_on_delivery" ? "Cartão no atendimento" : "Pendente"}</strong></div>
        <div className="plat-track__row"><span>Modalidade</span><strong>{order.fulfillment === "delivery" ? "Entrega" : order.fulfillment === "pickup" ? "Retirada" : "No local"}</strong></div>
        <div className="plat-track__row"><span>Total</span><strong>{money(order.total_price)}</strong></div>
        <div className="plat-track__row"><span>Atualização</span><strong>{refreshing ? "Atualizando…" : "Automática a cada 10s"}</strong></div>
      </section>
      <section className="plat-track__items"><h2>Itens</h2>{(order.items || []).map((item)=><div className="plat-track__row" key={item.id}><span>{item.quantity}× {item.name || "Item"}</span><strong>{money(item.subtotal)}</strong></div>)}</section>
    </> : null}
  </main></div>;
}

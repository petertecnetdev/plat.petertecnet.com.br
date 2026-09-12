import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getMyOrder, getMyOrderPayment } from "../../services/platCommerceApi";
import { trackTelemetryEvent } from "../../telemetry";
import "./CustomerOrders.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const stages = ["pending", "confirmed", "preparing", "ready", "completed"];
const labels = { pending: "Recebido", confirmed: "Confirmado", preparing: "Em preparo", ready: "Pronto", completed: "Concluído", cancelled: "Cancelado" };

export default function OrderTrackingPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const paymentBoxRef = useRef(null);
  const recoveryOpenedRef = useRef(false);
  const recoveryPaidRef = useRef(false);
  const recoverySource = new URLSearchParams(location.search).get("recovery_source") || "";
  const isRecovery = recoverySource === "in_app";

  useEffect(() => {
    let active = true;
    let timer;
    const load = async (silent = false) => {
      try {
        const next = await getMyOrder(id);
        if (!active) return;
        setOrder(next);

        if (isRecovery && !recoveryOpenedRef.current) {
          recoveryOpenedRef.current = true;
          trackTelemetryEvent("plat_checkout_recovery_opened", {
            target: "pix_recovery",
            label: String(next?.order_number || next?.id || id),
            metadata: {
              order_id: next?.id || id,
              recovery_source: recoverySource,
              payment_method: next?.payment_method || null,
              payment_status: next?.payment_status || null,
              amount: Number(next?.total_price || 0),
            },
          });
        }

        if (isRecovery && next?.payment_status === "paid" && !recoveryPaidRef.current) {
          recoveryPaidRef.current = true;
          trackTelemetryEvent("plat_checkout_recovery_paid", {
            target: "pix_recovery",
            label: String(next?.order_number || next?.id || id),
            metadata: {
              order_id: next?.id || id,
              recovery_source: recoverySource,
              amount: Number(next?.total_price || 0),
            },
          });
        }

        if (next?.payment_method === "pix" && next?.payment_status !== "paid") {
          try {
            const nextPayment = await getMyOrderPayment(id);
            if (active) setPayment(nextPayment);
          } catch {
            // O pedido continua sendo acompanhado mesmo se o provedor de pagamento estiver indisponível.
          }
        } else if (next?.payment_status === "paid") {
          setPayment(null);
        }
      } catch (error) {
        if (!silent && active) Swal.fire("Erro", apiErrorMessage(error, "Não foi possível carregar o pedido."), "error");
      } finally { if (!silent && active) setLoading(false); }
    };
    load();
    timer = window.setInterval(() => load(true), 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id, isRecovery, recoverySource]);

  useEffect(() => {
    if (!isRecovery || !payment || order?.payment_status === "paid") return;
    paymentBoxRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [isRecovery, order?.payment_status, payment]);

  const currentIndex = useMemo(() => stages.indexOf(order?.status), [order?.status]);
  const copyPix = async (value, method = "qr_code") => {
    if (isRecovery) {
      trackTelemetryEvent("plat_checkout_recovery_pix_copied", {
        target: "pix_recovery",
        label: String(order?.order_number || order?.id || id),
        metadata: {
          order_id: order?.id || id,
          recovery_source: recoverySource,
          copy_method: method,
          amount: Number(order?.total_price || 0),
        },
      });
    }

    try {
      await navigator.clipboard.writeText(value);
      Swal.fire({ icon: "success", title: "Pix copiado", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire("Copie o código", value, "info");
    }
  };

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando seu pedido…"]}/>;
  if (!order) return null;

  return <div className="plat-customer-orders"><NavlogComponent/><main className="plat-customer-orders__main plat-track">
    <header className="plat-customer-orders__head"><div><span className="plat-customer-orders__eyebrow">Acompanhamento ao vivo</span><h1>Pedido #{order.order_number || order.id}</h1><p>{order.establishment?.fantasy || order.establishment?.name}</p></div><Link to="/my-orders">Todos os pedidos</Link></header>
    {isRecovery && order.payment_status !== "paid" && <div className="plat-payment-box" role="status"><strong>Finalize seu Pix para confirmar este pedido</strong><p>Você voltou pelo lembrete de pagamento. O código Pix está logo abaixo para concluir sem refazer o pedido.</p></div>}
    {isRecovery && order.payment_status === "paid" && <div className="plat-payment-box" role="status"><strong>Pagamento confirmado</strong><p>Seu Pix foi confirmado e o pedido segue normalmente.</p></div>}
    {order.status === "cancelled" ? <div className="plat-payment-box"><strong>Pedido cancelado</strong><p>Este pedido não seguirá para preparo.</p></div> : <div className="plat-track__timeline">{stages.map((stage,index)=><div className={`plat-track__step${index <= currentIndex ? " is-active" : ""}`} key={stage}>{labels[stage]}</div>)}</div>}
    <section className="plat-track__summary"><div className="plat-track__row"><span>Status</span><strong>{labels[order.status] || order.status}</strong></div><div className="plat-track__row"><span>Pagamento</span><strong>{order.payment_status === "paid" ? "Pago" : "Pendente"}</strong></div><div className="plat-track__row"><span>Modalidade</span><strong>{order.fulfillment === "delivery" ? "Entrega" : order.fulfillment === "pickup" ? "Retirada" : "No local"}</strong></div><div className="plat-track__row"><span>Total</span><strong>{money(order.total_price)}</strong></div></section>
    {payment && order.payment_status !== "paid" && <section className="plat-payment-box" ref={paymentBoxRef}><h2>Pagamento Pix</h2><p>Valor: <strong>{money(payment.amount || order.total_price)}</strong></p>{payment.qr_code_base64 && <img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix"/>}{payment.qr_code && <><p>Pix copia e cola</p><button type="button" className="btn btn-primary" onClick={()=>copyPix(payment.qr_code, "qr_code")}>Copiar código Pix</button></>}{payment.pix_key && <><p>Chave Pix do restaurante</p><strong style={{wordBreak:"break-all"}}>{payment.pix_key}</strong><div style={{marginTop:12}}><button type="button" className="btn btn-primary" onClick={()=>copyPix(payment.pix_key, "pix_key")}>Copiar chave Pix</button></div></>}{payment.ticket_url && <p><a href={payment.ticket_url} target="_blank" rel="noreferrer">Abrir instruções de pagamento</a></p>}{!payment.qr_code && !payment.pix_key && <p>O Pix está sendo preparado. Esta tela atualiza automaticamente.</p>}</section>}
    {order.delivery_address && <section className="plat-track__delivery"><h2>Entrega</h2><p>{order.delivery_address}</p></section>}
    <section className="plat-track__items"><h2>Itens</h2>{(order.items || []).map((item)=><div className="plat-track__row" key={item.id}><span>{item.quantity}× {item.name || "Item"}{item.notes ? <small> · {item.notes}</small> : null}</span><strong>{money(item.subtotal)}</strong></div>)}</section>
  </main></div>;
}

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, trackGuestOrder } from "../../services/platCommerceApi";
import { readGuestOrder, rememberGuestOrderPhone } from "../../utils/guestOrderTracking";
import { claimRepeatOrderConversion, markRepeatOrderConversionMilestone, rememberRepeatOrderContext, restoreTrackedOrderCart } from "../../utils/repeatOrder";
import { trackTelemetryEvent } from "../../telemetry";
import "./CustomerOrders.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const stages = ["pending", "confirmed", "preparing", "ready", "completed"];
const labels = { pending: "Recebido", confirmed: "Confirmado", preparing: "Em preparo", ready: "Pronto", completed: "Concluído", cancelled: "Cancelado" };

export default function GuestOrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stored = useMemo(() => readGuestOrder(id), [id]);
  const [phone, setPhone] = useState(stored?.phone || "");
  const [credential, setCredential] = useState(stored?.phone || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(stored?.phone));
  const [refreshing, setRefreshing] = useState(false);
  const openedRef = useRef(false);
  const recoveryPresentedRef = useRef(false);
  const payment = order?.payment || null;

  useEffect(() => {
    if (!credential) return undefined;
    let active = true;
    let timer;

    const trackRepeatRevenue = (next) => {
      const conversion = claimRepeatOrderConversion(next);
      if (!conversion) return;
      if (next?.payment_status === "paid") {
        const paid = markRepeatOrderConversionMilestone(next.id, "paid");
        if (paid) trackTelemetryEvent("plat_guest_order_reorder_paid", { target: "repeat_order", label: String(next?.order_number || next?.id || id), metadata: { source_order_id: paid.source_order_id, new_order_id: next?.id || id, establishment_id: next?.establishment?.id || paid.establishment_id || null, amount: Number(next?.total_price || 0), payment_method: next?.payment_method || null, fulfillment: next?.fulfillment || null } });
      }
      if (next?.status === "completed") {
        const completed = markRepeatOrderConversionMilestone(next.id, "completed");
        if (completed) trackTelemetryEvent("plat_guest_order_reorder_completed", { target: "repeat_order", label: String(next?.order_number || next?.id || id), metadata: { source_order_id: completed.source_order_id, new_order_id: next?.id || id, establishment_id: next?.establishment?.id || completed.establishment_id || null, amount: Number(next?.total_price || 0), payment_status: next?.payment_status || null, payment_method: next?.payment_method || null, fulfillment: next?.fulfillment || null } });
      }
    };

    const load = async (silent = false) => {
      if (!silent) setLoading(true); else setRefreshing(true);
      try {
        const next = await trackGuestOrder(id, credential);
        if (!active) return;
        setOrder(next);
        rememberGuestOrderPhone(id, credential);
        trackRepeatRevenue(next);
        if (!openedRef.current) {
          openedRef.current = true;
          trackTelemetryEvent("plat_guest_order_tracking_opened", { target: "guest_order", label: String(next?.order_number || next?.id || id), metadata: { order_id: next?.id || id, order_status: next?.status || null, payment_status: next?.payment_status || null, fulfillment: next?.fulfillment || null, amount: Number(next?.total_price || 0) } });
        }
        if (next?.payment && next?.payment_method === "pix" && next?.payment_status !== "paid" && !recoveryPresentedRef.current) {
          recoveryPresentedRef.current = true;
          trackTelemetryEvent("plat_guest_pix_recovery_presented", { target: "pix_recovery", label: String(next?.order_number || next?.id || id), metadata: { entity_type: "establishment", entity_id: next?.establishment?.id || null, establishment_id: next?.establishment?.id || null, order_id: next?.id || id, amount: Number(next?.total_price || 0), recovery_source: new URLSearchParams(window.location.search).get("recovery_source") || null } });
        }
      } catch (error) {
        if (!silent && active) {
          setOrder(null); setCredential("");
          Swal.fire("Não foi possível localizar", apiErrorMessage(error, "Confira o telefone usado no pedido e tente novamente."), "error");
        }
      } finally { if (active) { setLoading(false); setRefreshing(false); } }
    };

    load();
    timer = window.setInterval(() => load(true), 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [id, credential]);

  const submitPhone = (event) => {
    event.preventDefault();
    const normalized = String(phone || "").trim();
    if (!normalized) return;
    openedRef.current = false;
    recoveryPresentedRef.current = false;
    setCredential(normalized);
  };

  const copyPix = async () => {
    const code = payment?.qr_code || payment?.pix_key;
    if (!code) return;
    trackTelemetryEvent("plat_guest_pix_recovery_copied", { target: "pix_recovery", label: String(order?.order_number || order?.id || id), metadata: { entity_type: "establishment", entity_id: order?.establishment?.id || null, establishment_id: order?.establishment?.id || null, order_id: order?.id || id, amount: Number(order?.total_price || 0) } });
    try { await navigator.clipboard.writeText(code); await Swal.fire("Pix copiado", "O código Pix foi copiado. Abra o app do seu banco para pagar.", "success"); }
    catch { await Swal.fire("Copie o Pix", code, "info"); }
  };

  const repeatOrder = async () => {
    const slug = String(order?.establishment?.slug || "").trim();
    if (!slug || !restoreTrackedOrderCart(order) || !rememberRepeatOrderContext(order)) {
      await Swal.fire("Não foi possível repetir", "Abra o cardápio e escolha novamente os itens disponíveis.", "info"); return;
    }
    trackTelemetryEvent("plat_guest_order_reorder_started", { target: "guest_order", label: String(order?.order_number || order?.id || id), metadata: { source_order_id: order?.id || id, establishment_id: order?.establishment?.id || null, item_count: (order?.items || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0), amount: Number(order?.total_price || 0) } });
    await Swal.fire({ title: "Carrinho preparado", text: "Recolocamos os itens base do pedido no carrinho. Preços, estoque e disponibilidade serão revalidados no cardápio; revise adicionais antes de confirmar.", icon: "success", confirmButtonText: "Revisar e pedir novamente" });
    navigate(`/establishment/view/${slug}?source=repeat_order`);
  };

  const currentIndex = stages.indexOf(order?.status);
  if (loading && credential && !order) return <ProcessingIndicatorComponent messages={["Localizando seu pedido…"]}/>;

  return <div className="plat-customer-orders"><NavlogComponent/><main className="plat-customer-orders__main plat-track">
    {!credential ? <section className="plat-track__summary" style={{maxWidth:620,margin:"40px auto"}}><span className="plat-customer-orders__eyebrow">Acompanhamento seguro</span><h1>Pedido #{stored?.order_number || id}</h1><p>Informe o mesmo telefone usado no checkout para acompanhar o pedido e, se houver Pix pendente, retomar o pagamento com segurança.</p><form onSubmit={submitPhone} style={{display:"grid",gap:12,marginTop:20}}><label htmlFor="guest-order-phone"><strong>Telefone do pedido</strong></label><input id="guest-order-phone" className="form-control" value={phone} onChange={(event)=>setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="(62) 99999-9999" required/><button type="submit" className="btn btn-primary">Acompanhar pedido</button></form><p style={{marginTop:16,fontSize:".9rem",opacity:.8}}>Por segurança, a Plat não exibe nome, telefone, endereço ou observações nesta página.</p></section> : order ? <>
      <header className="plat-customer-orders__head"><div><span className="plat-customer-orders__eyebrow">Acompanhamento ao vivo</span><h1>Pedido #{order.order_number || order.id}</h1><p>{order.establishment?.fantasy || order.establishment?.name}</p></div>{order.establishment?.slug ? <Link to={`/establishment/view/${order.establishment.slug}`}>Voltar ao cardápio</Link> : null}</header>
      {order.status === "cancelled" ? <div className="plat-payment-box"><strong>Pedido cancelado</strong><p>Este pedido não seguirá para preparo. Fale com o estabelecimento se precisar de ajuda.</p></div> : <div className="plat-track__timeline">{stages.map((stage,index)=><div className={`plat-track__step${index <= currentIndex ? " is-active" : ""}`} key={stage}>{labels[stage]}</div>)}</div>}
      <section className="plat-track__summary"><div className="plat-track__row"><span>Status</span><strong>{labels[order.status] || order.status}</strong></div><div className="plat-track__row"><span>Pagamento</span><strong>{order.payment_status === "paid" ? "Pago" : order.payment_method === "cash" ? "Pagamento no atendimento" : order.payment_method === "card_on_delivery" ? "Cartão no atendimento" : "Pendente"}</strong></div><div className="plat-track__row"><span>Modalidade</span><strong>{order.fulfillment === "delivery" ? "Entrega" : order.fulfillment === "pickup" ? "Retirada" : "No local"}</strong></div><div className="plat-track__row"><span>Total</span><strong>{money(order.total_price)}</strong></div><div className="plat-track__row"><span>Atualização</span><strong>{refreshing ? "Atualizando…" : "Automática a cada 10s"}</strong></div></section>
      {order.payment_method === "pix" && order.payment_status !== "paid" && payment ? <section className="plat-payment-box" style={{marginTop:16}}><strong>Finalize seu Pix</strong><p>Estas instruções foram recuperadas com segurança após validar o telefone do pedido. Você não precisa refazer a compra.</p>{payment.qr_code_base64 ? <img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix" style={{display:"block",width:220,maxWidth:"100%",margin:"16px auto",borderRadius:12}}/> : null}{payment.qr_code || payment.pix_key ? <button type="button" className="btn btn-primary" onClick={copyPix}>Copiar Pix</button> : null}{payment.ticket_url ? <p style={{marginTop:12}}><a href={payment.ticket_url} target="_blank" rel="noreferrer">Abrir instruções de pagamento</a></p> : null}</section> : null}
      <section className="plat-track__items"><h2>Itens</h2>{(order.items || []).map((item)=><div className="plat-track__row" key={item.id}><span>{item.quantity}× {item.name || "Item"}</span><strong>{money(item.subtotal)}</strong></div>)}</section>
      {order.status === "completed" && order.establishment?.slug && (order.items || []).length > 0 ? <section className="plat-track__summary" style={{marginTop:16}}><strong>Gostou do pedido?</strong><p style={{margin:"8px 0 16px"}}>Repita os itens em poucos segundos. Antes de comprar novamente, a Plat confere o cardápio atual, o estoque e os preços.</p><button type="button" className="btn btn-primary" onClick={repeatOrder}>Pedir novamente</button></section> : null}
    </> : null}
  </main></div>;
}

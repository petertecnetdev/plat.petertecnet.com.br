import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getOrderingSettings, updateOrderingSettings } from "../../services/platCommerceApi";
import "./OrderingSettings.css";

const days = [
  ["monday", "Segunda"], ["tuesday", "Terça"], ["wednesday", "Quarta"],
  ["thursday", "Quinta"], ["friday", "Sexta"], ["saturday", "Sábado"], ["sunday", "Domingo"],
];
const defaultHours = () => Object.fromEntries(days.map(([key]) => [key, [{ open: "11:00", close: "23:00" }]]));

export default function OrderingSettingsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    getOrderingSettings(id).then((result) => {
      if (!active) return;
      setData({ ...result, opening_hours: Object.keys(result?.opening_hours || {}).length ? result.opening_hours : defaultHours() });
    }).catch((error) => Swal.fire("Erro", apiErrorMessage(error, "Não foi possível carregar a configuração."), "error"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const paymentMethods = useMemo(() => new Set(data?.payment_methods || []), [data?.payment_methods]);
  const toggle = (field) => setData((current) => ({ ...current, [field]: !current[field] }));
  const togglePayment = (method) => setData((current) => {
    const set = new Set(current.payment_methods || []); set.has(method) ? set.delete(method) : set.add(method);
    return { ...current, payment_methods: [...set] };
  });
  const updateHour = (day, field, value) => setData((current) => ({ ...current, opening_hours: { ...current.opening_hours, [day]: [{ ...(current.opening_hours?.[day]?.[0] || {}), [field]: value }] } }));
  const toggleDay = (day) => setData((current) => ({ ...current, opening_hours: { ...current.opening_hours, [day]: current.opening_hours?.[day] ? null : [{ open: "11:00", close: "23:00" }] } }));

  const save = async () => {
    if (!data.payment_methods?.length) { Swal.fire("Pagamento necessário", "Selecione ao menos uma forma de pagamento.", "warning"); return; }
    setSaving(true);
    try {
      const opening_hours = Object.fromEntries(Object.entries(data.opening_hours || {}).filter(([, value]) => Array.isArray(value) && value.length));
      const updated = await updateOrderingSettings(id, {
        ordering_enabled: !!data.ordering_enabled,
        accepting_orders: !!data.accepting_orders,
        delivery_enabled: !!data.delivery_enabled,
        pickup_enabled: !!data.pickup_enabled,
        dine_in_enabled: !!data.dine_in_enabled,
        delivery_fee: Number(data.delivery_fee || 0),
        minimum_order: Number(data.minimum_order || 0),
        estimated_delivery_minutes: Number(data.estimated_delivery_minutes || 45),
        opening_hours,
        payment_methods: data.payment_methods,
        pix_key: data.pix_key || null,
      });
      setData((current) => ({ ...current, ...updated }));
      Swal.fire("Salvo", "A operação de pedidos foi atualizada.", "success");
    } catch (error) { Swal.fire("Erro", apiErrorMessage(error, "Não foi possível salvar."), "error"); }
    finally { setSaving(false); }
  };

  if (loading || !data) return <ProcessingIndicatorComponent messages={["Carregando configuração de pedidos…"]}/>;
  return <div className="plat-settings"><NavlogComponent/><main className="plat-settings__main">
    <header className="plat-settings__head"><div><span className="plat-customer-orders__eyebrow">Operação</span><h1>Pedidos de {data.establishment?.fantasy || data.establishment?.name}</h1></div><Link to="/dashboard">Voltar ao dashboard</Link></header>
    <div className="plat-settings__grid">
      <section className="plat-settings__card"><h2>Disponibilidade</h2>
        <div className="plat-toggle-row"><div><strong>Pedidos online</strong><small>Exibe o botão de pedido no cardápio.</small></div><input type="checkbox" checked={!!data.ordering_enabled} onChange={()=>toggle("ordering_enabled")}/></div>
        <div className="plat-toggle-row"><div><strong>Recebendo pedidos agora</strong><small>Use para pausar a cozinha sem alterar horários.</small></div><input type="checkbox" checked={!!data.accepting_orders} onChange={()=>toggle("accepting_orders")}/></div>
        <div className="plat-toggle-row"><div><strong>Entrega</strong></div><input type="checkbox" checked={!!data.delivery_enabled} onChange={()=>toggle("delivery_enabled")}/></div>
        <div className="plat-toggle-row"><div><strong>Retirada</strong></div><input type="checkbox" checked={!!data.pickup_enabled} onChange={()=>toggle("pickup_enabled")}/></div>
        <div className="plat-toggle-row"><div><strong>Consumo no local</strong></div><input type="checkbox" checked={!!data.dine_in_enabled} onChange={()=>toggle("dine_in_enabled")}/></div>
      </section>
      <section className="plat-settings__card"><h2>Valores e prazo</h2><div className="plat-settings__fields">
        <label>Taxa de entrega (R$)<input type="number" min="0" step="0.01" value={data.delivery_fee} onChange={(e)=>setData({...data,delivery_fee:e.target.value})}/></label>
        <label>Pedido mínimo (R$)<input type="number" min="0" step="0.01" value={data.minimum_order} onChange={(e)=>setData({...data,minimum_order:e.target.value})}/></label>
        <label>Prazo estimado (min)<input type="number" min="1" value={data.estimated_delivery_minutes || 45} onChange={(e)=>setData({...data,estimated_delivery_minutes:e.target.value})}/></label>
      </div></section>
      <section className="plat-settings__card" style={{gridColumn:"1/-1"}}><h2>Horários</h2><div className="plat-hours">{days.map(([key,label])=>{const range=data.opening_hours?.[key]?.[0];return <div className="plat-hours__row" key={key}><span>{label}</span><input type="time" disabled={!range} value={range?.open || "11:00"} onChange={(e)=>updateHour(key,"open",e.target.value)}/><input type="time" disabled={!range} value={range?.close || "23:00"} onChange={(e)=>updateHour(key,"close",e.target.value)}/><button type="button" className="plat-payment-option" onClick={()=>toggleDay(key)}>{range?"Fechar neste dia":"Abrir neste dia"}</button></div>})}</div></section>
      <section className="plat-settings__card"><h2>Pagamento</h2><div className="plat-payment-options"><button type="button" className={`plat-payment-option${paymentMethods.has("pix")?" is-active":""}`} onClick={()=>togglePayment("pix")}>Pix</button><button type="button" className={`plat-payment-option${paymentMethods.has("cash")?" is-active":""}`} onClick={()=>togglePayment("cash")}>Dinheiro</button><button type="button" className={`plat-payment-option${paymentMethods.has("card_on_delivery")?" is-active":""}`} onClick={()=>togglePayment("card_on_delivery")}>Cartão na entrega</button></div>{!data.mercadopago_configured && paymentMethods.has("pix") && <><label style={{marginTop:14}}>Chave Pix do restaurante<input type="text" value={data.pix_key || ""} onChange={(e)=>setData({...data,pix_key:e.target.value})} placeholder="CPF, CNPJ, e-mail, telefone ou aleatória"/></label><div className="plat-settings__notice">Sem credencial Mercado Pago na API, a Plat usa a chave Pix informada e mantém o pagamento pendente até confirmação operacional.</div></>}</section>
      <section className="plat-settings__card"><h2>Status técnico do Pix</h2><p>{data.mercadopago_configured ? "Mercado Pago configurado na API: o Pix pode ser gerado e confirmado por webhook." : "Mercado Pago ainda não possui credencial ativa na API."}</p></section>
    </div><div className="plat-settings__actions"><button type="button" className="plat-settings__save" disabled={saving} onClick={save}>{saving?"Salvando…":"Salvar operação"}</button></div>
  </main></div>;
}

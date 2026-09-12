import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getOrderingSettings, updateOrderingSettings } from "../../services/platCommerceApi";
import { trackTelemetryEvent } from "../../telemetry";
import "./OrderingSettings.css";

const days = [
  ["monday", "Segunda"], ["tuesday", "Terça"], ["wednesday", "Quarta"],
  ["thursday", "Quinta"], ["friday", "Sexta"], ["saturday", "Sábado"], ["sunday", "Domingo"],
];
const defaultHours = () => Object.fromEntries(days.map(([key]) => [key, [{ open: "11:00", close: "23:00" }]]));
const publicMenuUrl = (establishment, source = "ordering_settings") => {
  const slug = String(establishment?.slug || "").trim();
  if (!slug) return "";
  return new URL(`/establishment/view/${encodeURIComponent(slug)}?source=${encodeURIComponent(source)}`, window.location.origin).toString();
};
const copyToClipboard = async (value) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // PWA/WebView can deny Clipboard API; use the legacy fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};
const sharePublicMenu = async (establishment) => {
  const url = publicMenuUrl(establishment, "ordering_onboarding_share");
  if (!url) return false;
  const title = establishment?.fantasy || establishment?.name || "Cardápio Plat";

  try {
    if (navigator.share) {
      await navigator.share({ title, text: `Confira o cardápio de ${title} na Plat.`, url });
      return true;
    }
  } catch (error) {
    if (error?.name === "AbortError") return false;
  }

  const copied = await copyToClipboard(url);
  if (copied) {
    await Swal.fire("Link copiado", "O cardápio está pronto para ser enviado aos primeiros clientes.", "success");
    return true;
  }

  await Swal.fire({ title: "Compartilhe seu cardápio", text: url, icon: "info", confirmButtonText: "Entendi" });
  return false;
};
const showMenuQrCode = async (establishment, source = "ordering_settings") => {
  const url = publicMenuUrl(establishment, "qr_menu");
  if (!url) {
    await Swal.fire("QR Code indisponível", "Salve o estabelecimento antes de gerar o QR Code.", "info");
    return false;
  }

  const title = establishment?.fantasy || establishment?.name || "Cardápio Plat";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&format=png&margin=24&data=${encodeURIComponent(url)}`;

  trackTelemetryEvent("plat_menu_qr_opened", {
    label: title,
    target: "menu_distribution",
    metadata: { source, slug: establishment?.slug || null },
  });

  const result = await Swal.fire({
    title: "QR Code do cardápio",
    text: "Mostre este QR nas mesas, balcão, caixa ou materiais impressos. Cada leitura abre seu cardápio público.",
    imageUrl: qrUrl,
    imageAlt: `QR Code do cardápio de ${title}`,
    imageWidth: 280,
    imageHeight: 280,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: "Copiar link",
    denyButtonText: "Abrir QR Code",
    cancelButtonText: "Fechar",
  });

  if (result.isConfirmed) {
    const copied = await copyToClipboard(url);
    await Swal.fire(copied ? "Link copiado" : "Link do cardápio", copied ? "Agora você pode divulgar o cardápio em qualquer canal." : url, copied ? "success" : "info");
    return copied;
  }

  if (result.isDenied) {
    window.open(qrUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return false;
};

export default function OrderingSettingsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const onboarding = location.state?.onboarding === true;
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
      const nextData = { ...data, ...updated };
      setData(nextData);

      trackTelemetryEvent("plat_ordering_configured", {
        label: nextData.establishment?.name || nextData.establishment?.fantasy || "Estabelecimento",
        target: "ordering_onboarding",
        metadata: {
          onboarding,
          ordering_enabled: !!nextData.ordering_enabled,
          accepting_orders: !!nextData.accepting_orders,
          payment_methods_count: nextData.payment_methods?.length || 0,
          next_step: onboarding ? "public_distribution" : "stay_in_settings",
        },
      });

      if (!onboarding) {
        await Swal.fire("Salvo", "A operação de pedidos foi atualizada.", "success");
        return;
      }

      const establishment = nextData.establishment || data.establishment;
      const slug = String(establishment?.slug || "").trim();
      if (!slug) {
        await Swal.fire("Operação pronta", "Os pedidos foram configurados. Volte ao dashboard para continuar.", "success");
        navigate("/dashboard", { replace: true });
        return;
      }

      const next = await Swal.fire({
        title: "Operação pronta para receber o primeiro pedido",
        text: "Seu cardápio e suas regras de pedido estão configurados. Agora coloque o cardápio na frente dos clientes.",
        icon: "success",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Compartilhar cardápio",
        denyButtonText: "Gerar QR Code",
        cancelButtonText: "Ver como cliente",
        allowOutsideClick: false,
      });

      if (next.isConfirmed) await sharePublicMenu(establishment);
      if (next.isDenied) await showMenuQrCode(establishment, "ordering_onboarding");
      navigate(`/establishment/view/${encodeURIComponent(slug)}?source=ordering_onboarding`, {
        replace: true,
        state: { onboarding: true, source: "ordering-configured" },
      });
    } catch (error) { Swal.fire("Erro", apiErrorMessage(error, "Não foi possível salvar."), "error"); }
    finally { setSaving(false); }
  };

  if (loading || !data) return <ProcessingIndicatorComponent messages={["Carregando configuração de pedidos…"]}/>;
  return <div className="plat-settings"><NavlogComponent/><main className="plat-settings__main">
    <header className="plat-settings__head"><div><span className="plat-customer-orders__eyebrow">Operação</span><h1>Pedidos de {data.establishment?.fantasy || data.establishment?.name}</h1></div><Link to="/dashboard">Voltar ao dashboard</Link></header>
    {onboarding && <div className="alert alert-info mb-4" role="status"><strong>Última etapa para começar a vender.</strong><div className="small mt-1">Ative os pedidos, escolha como o cliente pode receber e pagar e salve. Em seguida, a Plat leva você direto para divulgar o cardápio.</div></div>}
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
      {data.establishment?.slug && <section className="plat-settings__card" style={{gridColumn:"1/-1"}}><h2>Divulgação física</h2><p>Gere um QR Code do cardápio para colocar nas mesas, balcão, caixa e materiais impressos. O cliente escaneia e abre o cardápio público direto no celular.</p><button type="button" className="plat-payment-option is-active" onClick={()=>showMenuQrCode(data.establishment, "ordering_settings")}>Gerar QR Code do cardápio</button></section>}
    </div><div className="plat-settings__actions"><button type="button" className="plat-settings__save" disabled={saving} onClick={save}>{saving?"Salvando…":onboarding?"Salvar e começar a vender":"Salvar operação"}</button></div>
  </main></div>;
}

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Badge, Spinner } from "react-bootstrap";
import { FaInstagram, FaMapMarkerAlt, FaWhatsapp } from "react-icons/fa";
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingBag, FiX } from "react-icons/fi";
import { storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { apiErrorMessage, createCheckout, getOrdering } from "../../services/platCommerceApi";
import "./Establishment.css";
import "../public/PublicRestaurantsPage.css";
import "./PlatCheckout.css";

const initials = (v) => String(v || "PL").trim().split(/\s+/).filter(Boolean).slice(0,2).map((p)=>p[0]).join("").toUpperCase();
const resolveImage = (img) => !img ? null : String(img).startsWith("http") ? img : `${storageUrl}/${String(img).replace(/^\//, "")}`;
const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const normalizeCart = (raw) => Object.fromEntries(Object.entries(raw || {}).map(([id, value]) => [id, typeof value === "number" ? { quantity: value, additions: [], removals: [], notes: "" } : { quantity: Number(value?.quantity || 0), additions: value?.additions || [], removals: value?.removals || [], notes: value?.notes || "" }]).filter(([,v])=>v.quantity>0));

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [ordering, setOrdering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cart, setCart] = useState(() => { try { return normalizeCart(JSON.parse(localStorage.getItem(`plat-cart:${slug}`) || "{}")); } catch { return {}; } });
  const [form, setForm] = useState({ customer_name: "", customer_phone: "", fulfillment: "", payment_method: "", delivery_address: "", notes: "" });

  useEffect(() => {
    let active = true;
    getOrdering(slug).then((data) => {
      if (!active) return;
      setEstablishment(data.establishment || null);
      setItems(Array.isArray(data.items) ? data.items : []);
      setOrdering(data.ordering || null);
      const fulfillment = data.ordering?.fulfillment?.delivery ? "delivery" : data.ordering?.fulfillment?.pickup ? "pickup" : data.ordering?.fulfillment?.["dine-in"] ? "dine-in" : "";
      const methods = Array.isArray(data.ordering?.payment_methods) ? data.ordering.payment_methods : [];
      setForm((current) => ({ ...current, fulfillment, payment_method: methods[0] || "cash" }));
    }).catch((error) => { console.error("[Plat] public restaurant", error); navigate("/restaurants", { replace: true }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, navigate]);

  useEffect(() => { localStorage.setItem(`plat-cart:${slug}`, JSON.stringify(cart)); }, [cart, slug]);

  const availableItems = useMemo(() => items.filter((i) => Number(i.status) === 1 && i.type !== "modifier"), [items]);
  const modifierItems = useMemo(() => items.filter((i) => i.type === "modifier" || String(i.category || "").toLowerCase().includes("adicion")), [items]);
  const grouped = useMemo(() => availableItems.reduce((acc,item)=>{const key=item.category||"Outros";(acc[key]||(acc[key]=[])).push(item);return acc;},{}), [availableItems]);
  const entry = (id) => cart[id] || { quantity: 0, additions: [], removals: [], notes: "" };
  const qty = (id) => Number(entry(id).quantity || 0);
  const updateLine = (id, patch) => setCart((current) => { const next = { ...current }; const base = next[id] || { quantity: 0, additions: [], removals: [], notes: "" }; const value = { ...base, ...patch }; if (Number(value.quantity) > 0) next[id] = value; else delete next[id]; return next; });
  const change = (id, delta) => updateLine(id, { quantity: Math.max(0, qty(id) + delta) });
  const toggleAddition = (id, modifierId) => { const line = entry(id); const active = line.additions.includes(modifierId); updateLine(id, { additions: active ? line.additions.filter((v)=>v!==modifierId) : [...line.additions, modifierId] }); };
  const cartLines = useMemo(() => availableItems.filter((i)=>qty(i.id)>0).map((i)=>({ ...i, ...entry(i.id) })), [availableItems, cart]);
  const subtotal = useMemo(() => cartLines.reduce((sum,line)=>sum + line.quantity * (Number(line.price||0) + (line.additions||[]).reduce((s,id)=>s+Number(items.find((i)=>Number(i.id)===Number(id))?.price||0),0)),0), [cartLines, items]);
  const fee = form.fulfillment === "delivery" ? Number(ordering?.delivery_fee || 0) : 0;
  const total = subtotal + fee;
  const cartCount = cartLines.reduce((s,i)=>s+i.quantity,0);

  const openCheckout = () => {
    if (!ordering?.available) { Swal.fire("Pedidos indisponíveis", ordering?.unavailable_reason || "O restaurante não está recebendo pedidos agora.", "info"); return; }
    if (!localStorage.getItem("token")) { navigate(`/login?redirect=${encodeURIComponent(`/establishment/view/${slug}`)}`); return; }
    if (subtotal < Number(ordering?.minimum_order || 0)) { Swal.fire("Pedido mínimo", `O pedido mínimo é ${money(ordering.minimum_order)}.`, "info"); return; }
    setCheckoutOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.fulfillment || !form.payment_method) return;
    if (!form.customer_name.trim() || !form.customer_phone.trim()) { Swal.fire("Dados necessários", "Informe seu nome e telefone.", "warning"); return; }
    if (form.fulfillment === "delivery" && !form.delivery_address.trim()) { Swal.fire("Endereço necessário", "Informe o endereço completo para entrega.", "warning"); return; }
    setSubmitting(true);
    try {
      const result = await createCheckout({ establishment_id: establishment.id, ...form, items: cartLines.map((line)=>({ item_id: line.id, quantity: line.quantity, additions: line.additions || [], removals: line.removals || [], notes: line.notes || null })) });
      setCart({}); setCheckoutOpen(false);
      if (result.payment) sessionStorage.setItem(`plat-payment:${result.order.id}`, JSON.stringify(result.payment));
      await Swal.fire("Pedido enviado", result.payment?.provider === "mercadopago" ? "Pedido criado. O Pix está disponível na tela de acompanhamento." : "Seu pedido foi registrado na Plat.", "success");
      navigate(`/my-orders/${result.order.id}`);
    } catch (error) { Swal.fire("Não foi possível concluir", apiErrorMessage(error, "Tente novamente."), "error"); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="establishment-page-vitrine"><NavlogComponent/><div className="d-flex justify-content-center align-items-center" style={{minHeight:420}}><Spinner animation="border" variant="warning"/></div></div>;
  if (!establishment) return null;
  let segments=[]; try { segments=Array.isArray(establishment.segments)?establishment.segments:JSON.parse(establishment.segments||"[]"); } catch { segments=[]; }
  const phoneLink=establishment.phone?`https://wa.me/55${establishment.phone.replace(/\D/g,"")}`:null;

  return <div className="establishment-page-vitrine"><NavlogComponent/>
    <div style={{width:"min(1380px,100%)",margin:"0 auto",padding:"20px clamp(14px,4vw,38px) 0"}}><Link to="/restaurants" className="estab-link"><FiArrowLeft/> Restaurantes</Link></div>
    <div className="estab-hero" style={resolveImage(establishment.background)?{background:`linear-gradient(90deg,rgba(10,13,18,.92) 44%,rgba(10,13,18,.62)),url('${resolveImage(establishment.background)}') center/cover no-repeat`}:undefined}><div className="estab-hero-inner"><div className="estab-logo-bubble">{resolveImage(establishment.logo)?<img src={resolveImage(establishment.logo)} alt="" className="estab-logo"/>:<span style={{fontSize:"1.6rem",fontWeight:900,color:"#efd89d"}}>{initials(establishment.name)}</span>}</div><div className="estab-info-block"><div className={`plat-ordering-state${ordering?.available?"":" is-closed"}`}>{ordering?.available ? "Recebendo pedidos" : ordering?.unavailable_reason || "Pedidos indisponíveis"}</div><h1 className="estab-title">{establishment.fantasy||establishment.name}</h1>{establishment.description&&<div className="estab-description">{establishment.description}</div>}<div className="estab-actions">{establishment.instagram_url&&<a href={establishment.instagram_url} target="_blank" rel="noreferrer" className="estab-link"><FaInstagram/> Instagram</a>}{phoneLink&&<a href={phoneLink} target="_blank" rel="noreferrer" className="estab-link"><FaWhatsapp/> WhatsApp</a>}{establishment.location&&<a href={establishment.location} target="_blank" rel="noreferrer" className="estab-link"><FaMapMarkerAlt/> Como chegar</a>}</div></div></div></div>
    <div className="estab-details-row"><div><b>Endereço: </b>{establishment.address?`${establishment.address}${establishment.city?` - ${establishment.city}`:""}`:"Não informado"}</div><div><b>Atende: </b>{segments.length?segments.map((seg)=><Badge key={seg} bg="warning" text="dark" className="me-1">{seg}</Badge>):"Consulte o restaurante"}</div>{ordering?.estimated_delivery_minutes ? <div><b>Entrega estimada: </b>{ordering.estimated_delivery_minutes} min</div> : null}</div>
    <section className="estab-cardapio-section"><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",marginBottom:18}}><div><span style={{color:"#efd89d",fontSize:12,fontWeight:800,textTransform:"uppercase",letterSpacing:1.4}}>Cardápio</span><h2 className="estab-cardapio-title" style={{margin:0}}>{establishment.fantasy||establishment.name}</h2></div><span style={{color:"#9ca6b4"}}>{availableItems.length} itens</span></div>
      {Object.keys(grouped).length===0?<div className="estab-vazio">Nenhum item disponível no momento.</div>:Object.entries(grouped).map(([cat,prods])=><div key={cat} className="estab-cardapio-bloco"><h3 className="estab-cat-title">{cat}</h3><div className="estab-items-grid">{prods.map((item)=><article className={`estab-cardapio-card ${Number(item.stock)<1?"estab-esgotado":""}`} key={item.id}>{resolveImage(item.image)&&<img src={resolveImage(item.image)} alt={item.name} className="estab-item-img"/>}<div className="estab-item-info"><div className="estab-item-row"><span className="estab-item-title">{item.name}</span>{item.is_featured?<Badge bg="warning" text="dark">Destaque</Badge>:null}</div><div className="estab-item-desc">{item.description||"Sem descrição"}</div><div className="estab-item-bottom-row"><span className="estab-item-preco">{money(item.price)}</span>{Number(item.stock)>0?(qty(item.id)?<span className="plat-cart-count"><button onClick={()=>change(item.id,-1)} aria-label="Remover"><FiMinus/></button><b>{qty(item.id)}</b><button onClick={()=>change(item.id,1)} aria-label="Adicionar"><FiPlus/></button></span>:<button className="plat-item-add" onClick={()=>change(item.id,1)} aria-label={`Adicionar ${item.name}`}><FiPlus/></button>):<span className="estab-item-indisponivel">Esgotado</span>}</div>{qty(item.id)>0 && <div className="plat-item-config"><textarea value={entry(item.id).notes} onChange={(e)=>updateLine(item.id,{notes:e.target.value})} placeholder="Observações deste item (ex.: sem cebola)" maxLength={500}/>{modifierItems.length>0 && <div className="plat-modifier-list">{modifierItems.slice(0,12).map((mod)=><button type="button" key={mod.id} className={`plat-modifier-chip${entry(item.id).additions.includes(mod.id)?" is-active":""}`} onClick={()=>toggleAddition(item.id,mod.id)}>+ {mod.name}{Number(mod.price)>0?` · ${money(mod.price)}`:""}</button>)}</div>}</div>}</div></article>)}</div></div>)}
    </section>
    {cartCount>0 && <><div className="plat-cart-panel"><div><strong>{cartCount} {cartCount===1?"item":"itens"}</strong><span> • {money(subtotal)}</span>{Number(ordering?.minimum_order||0)>subtotal?<small className="plat-minimum-note"> · mínimo {money(ordering.minimum_order)}</small>:null}</div><div className="plat-cart-checkout"><button className="plat-customer-cta" disabled={!ordering?.available} onClick={openCheckout}><FiShoppingBag/>{ordering?.available?"Continuar pedido":"Pedidos pausados"}</button></div></div><p className="plat-cart-note">O carrinho fica salvo neste dispositivo até você finalizar o pedido.</p></>}

    {checkoutOpen && <div className="plat-checkout-backdrop" role="dialog" aria-modal="true"><form className="plat-checkout" onSubmit={submit}><div className="plat-checkout__head"><div><span className="plat-customer-orders__eyebrow">Finalizar pedido</span><h2>{establishment.fantasy||establishment.name}</h2></div><button className="plat-checkout__close" type="button" onClick={()=>setCheckoutOpen(false)} aria-label="Fechar"><FiX/></button></div><div className="plat-checkout__grid">
      <label>Nome<input value={form.customer_name} onChange={(e)=>setForm({...form,customer_name:e.target.value})} autoComplete="name" required/></label><label>Telefone<input value={form.customer_phone} onChange={(e)=>setForm({...form,customer_phone:e.target.value})} autoComplete="tel" required/></label>
      <div className="plat-checkout__wide"><span>Como quer receber?</span><div className="plat-checkout__options">{ordering?.fulfillment?.delivery&&<button type="button" className={`plat-checkout__option${form.fulfillment==="delivery"?" is-active":""}`} onClick={()=>setForm({...form,fulfillment:"delivery"})}>Entrega</button>}{ordering?.fulfillment?.pickup&&<button type="button" className={`plat-checkout__option${form.fulfillment==="pickup"?" is-active":""}`} onClick={()=>setForm({...form,fulfillment:"pickup"})}>Retirada</button>}{ordering?.fulfillment?.["dine-in"]&&<button type="button" className={`plat-checkout__option${form.fulfillment==="dine-in"?" is-active":""}`} onClick={()=>setForm({...form,fulfillment:"dine-in"})}>No local</button>}</div></div>
      {form.fulfillment==="delivery"&&<label className="plat-checkout__wide">Endereço completo<textarea value={form.delivery_address} onChange={(e)=>setForm({...form,delivery_address:e.target.value})} placeholder="Rua, número, complemento, bairro e referência" required/></label>}
      <label className="plat-checkout__wide">Pagamento<select value={form.payment_method} onChange={(e)=>setForm({...form,payment_method:e.target.value})}>{(ordering?.payment_methods||[]).map((method)=><option value={method} key={method}>{method==="pix"?"Pix online":method==="cash"?"Dinheiro na entrega/retirada":"Cartão na entrega/retirada"}</option>)}</select></label>
      <label className="plat-checkout__wide">Observações do pedido<textarea value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})} placeholder="Portaria, troco, referência ou observação geral"/></label>
    </div><div className="plat-checkout__totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{fee>0&&<div><span>Taxa de entrega</span><strong>{money(fee)}</strong></div>}<div><span>Total</span><strong>{money(total)}</strong></div></div><button className="plat-checkout__submit" disabled={submitting} type="submit">{submitting?"Enviando pedido…":`Confirmar · ${money(total)}`}</button></form></div>}
  </div>;
}

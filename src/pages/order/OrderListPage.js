import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiErrorMessage, getEstablishmentOrders, updateOrderStatus } from "../../services/platCommerceApi";
import "./List.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const formatDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString("pt-BR") : "—";

const beep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = 880; gain.gain.value = 0.05; osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.18);
  } catch { /* navegador pode bloquear áudio sem interação */ }
};

export default function OrderListPage() {
  const { entityId } = useParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const knownIds = useRef(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await getEstablishmentOrders(Number(entityId), { per_page: 100 });
      const next = Array.isArray(result?.data) ? result.data : [];
      if (silent && knownIds.current.size && next.some((order) => !knownIds.current.has(order.id) && order.status === "pending")) beep();
      knownIds.current = new Set(next.map((order) => order.id));
      setOrders(next);
    } catch (error) {
      if (!silent) Swal.fire({ icon: "error", title: "Não foi possível carregar os pedidos", text: apiErrorMessage(error, "Tente novamente em instantes.") });
    } finally { if (!silent) setLoading(false); }
  }, [entityId]);

  useEffect(() => {
    load(false);
    const timer = window.setInterval(() => load(true), 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => (!status || order.status === status) && (!term || [order.order_number, order.customer_name, order.fulfillment, order.payment_method, order.status].some((v)=>String(v||"").toLowerCase().includes(term))));
  }, [orders, search, status]);
  const total = useMemo(() => filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0), [filteredOrders]);

  const changeStatus = async (order, nextStatus) => {
    if (!order?.id || !nextStatus || nextStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item));
    } catch (error) { Swal.fire("Erro", apiErrorMessage(error, "Não foi possível alterar o status."), "error"); }
    finally { setUpdatingId(null); }
  };

  return <><NavlogComponent/><main className="main-container plat-orders-page">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 plat-page-head"><div><span className="text-muted">Atualização automática a cada 8 segundos</span><h1 className="page-header mb-0">Pedidos</h1></div><Link className="btn btn-primary" to={`/order/create/${entityId}`}>+ Novo pedido</Link></div>
    <section className="card-container mb-4"><div className="row g-3 align-items-end"><div className="col-12 col-lg-7"><label className="form-label">Buscar pedido</label><input className="form-control" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cliente, número ou pagamento"/></div><div className="col-12 col-lg-3"><label className="form-label">Status</label><select className="form-select" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">Todos</option><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="preparing">Em preparo</option><option value="ready">Pronto</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></div><div className="col-12 col-lg-2"><button type="button" className="btn btn-secondary w-100" onClick={()=>load(false)}>Atualizar agora</button></div></div></section>
    <section className="card-container mb-4 plat-order-summary"><div><span className="text-muted">Pedidos exibidos</span><strong>{filteredOrders.length}</strong></div><div><span className="text-muted">Valor total</span><strong>{money(total)}</strong></div></section>
    {loading ? <ProcessingIndicatorComponent compact messages={["Carregando pedidos…"]}/> : filteredOrders.length === 0 ? <section className="card-container text-center py-5"><h2 className="h5">Nenhum pedido encontrado</h2><p className="text-muted mb-3">{orders.length ? "Nenhum pedido corresponde aos filtros." : "Ainda não há pedidos neste estabelecimento."}</p></section> : <section className="card-container table-responsive p-0"><table className="table align-middle mb-0"><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Consumo</th><th>Pagamento</th><th>Total</th><th>Status</th><th className="text-end">Ações</th></tr></thead><tbody>{filteredOrders.map((order)=><tr key={order.id}><td>#{order.order_number||order.id}</td><td>{order.customer_name||"Não informado"}<small className="d-block text-muted">{order.customer_phone||""}</small></td><td>{formatDate(order.created_at)}</td><td>{order.fulfillment||"—"}</td><td><div>{order.payment_method||"—"}</div><small className="text-muted">{order.payment_status||"—"}</small></td><td>{money(order.total_price)}</td><td style={{minWidth:160}}><select className="form-select form-select-sm" value={order.status||"pending"} disabled={updatingId===order.id || order.status==="cancelled"} onChange={(e)=>changeStatus(order,e.target.value)}><option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="preparing">Em preparo</option><option value="ready">Pronto</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option></select></td><td className="text-end"><Link className="btn btn-sm btn-secondary" to={`/order/edit/${entityId}/${order.id}`}>Detalhes</Link></td></tr>)}</tbody></table></section>}
  </main></>;
}

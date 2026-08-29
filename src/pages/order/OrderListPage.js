import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, apiV1BaseUrl, appId, storageUrl } from "../../config";
import "./List.css";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
};

const apiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  (error?.response?.data?.errors
    ? Object.values(error.response.data.errors).flat().join("\n")
    : "") ||
  fallback;

export default function OrderListPage() {
  const { entityId } = useParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [establishment, setEstablishment] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const id = Number(entityId);
      if (!id || Number.isNaN(id)) throw new Error("Estabelecimento inválido.");

      const headers = authHeaders();

      // Never resolve an establishment through the legacy global endpoint.
      // The v1 account context returns only establishments owned by this Plat app.
      const { data: accountResponse } = await axios.get(`${apiV1BaseUrl}/me`, { headers });
      const context = accountResponse?.data || {};
      const scopedEstablishments = Array.isArray(context.establishments)
        ? context.establishments.filter((entry) => Number(entry.app_id) === Number(appId))
        : [];
      const est = scopedEstablishments.find((entry) => Number(entry.id) === id);

      if (!est?.id || !est?.slug) {
        throw new Error("Este estabelecimento não pertence à Plat ou não está disponível.");
      }

      let rawOrders = [];
      try {
        const orderRes = await axios.get(
          `${apiBaseUrl}/order/list-by-entity-slug/${encodeURIComponent(est.slug)}`,
          { headers }
        );
        rawOrders = Array.isArray(orderRes.data?.orders) ? orderRes.data.orders : [];
      } catch (error) {
        // Empty operation must be rendered as an empty state, not as a blocking error.
        if (error?.response?.status !== 404) throw error;
      }

      const platOrders = rawOrders.filter(
        (order) => order.app_id == null || Number(order.app_id) === Number(appId)
      );

      setEstablishment(est);
      setOrders(platOrders);
    } catch (error) {
      console.error("[Plat] Falha ao listar pedidos", error);
      setEstablishment(null);
      setOrders([]);
      await Swal.fire({
        icon: "error",
        title: "Não foi possível carregar os pedidos",
        text: apiMessage(error, "Tente novamente em instantes."),
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = !status || String(order.status || "") === status;
      if (!matchesStatus) return false;
      if (!term) return true;
      return [
        order.order_number,
        order.customer_name,
        order.origin,
        order.fulfillment,
        order.payment_method,
        order.status,
      ].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [orders, search, status]);

  const total = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0),
    [filteredOrders]
  );

  const updateStatus = async (order, nextStatus) => {
    if (!order?.id || !nextStatus || nextStatus === order.status) return;
    setUpdatingId(order.id);
    try {
      await axios.put(
        `${apiBaseUrl}/order/${order.id}/update-status`,
        { status: nextStatus },
        { headers: authHeaders() }
      );
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível alterar o status do pedido."), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const logo = establishment?.logo
    ? `${storageUrl}/${establishment.logo}`
    : "/images/logo.png";

  return (
    <>
      <NavlogComponent />
      <main className="main-container plat-orders-page">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 plat-page-head">
          <div className="d-flex align-items-center gap-3 plat-page-head__identity">
            <img
              src={logo}
              alt=""
              className="plat-page-head__logo"
              onError={(event) => { event.currentTarget.src = "/images/logo.png"; }}
            />
            <div>
              <span className="text-muted">{establishment?.name || "Operação Plat"}</span>
              <h1 className="page-header mb-0">Pedidos</h1>
            </div>
          </div>

          {establishment && (
            <Link className="btn btn-primary" to={`/order/create/${entityId}`}>
              + Novo pedido
            </Link>
          )}
        </div>

        <section className="card-container mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-7">
              <label className="form-label">Buscar pedido</label>
              <input className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, número, origem ou pagamento" />
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="confirmed">Confirmado</option>
                <option value="preparing">Em preparo</option>
                <option value="ready">Pronto</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <button type="button" className="btn btn-secondary w-100" onClick={load}>Atualizar</button>
            </div>
          </div>
        </section>

        <section className="card-container mb-4 plat-order-summary">
          <div>
            <span className="text-muted">Pedidos exibidos</span>
            <strong>{filteredOrders.length}</strong>
          </div>
          <div>
            <span className="text-muted">Valor total</span>
            <strong>{money(total)}</strong>
          </div>
        </section>

        {loading ? (
          <ProcessingIndicatorComponent compact messages={["Carregando pedidos…"]} />
        ) : filteredOrders.length === 0 ? (
          <section className="card-container text-center py-5">
            <h2 className="h5">Nenhum pedido encontrado</h2>
            <p className="text-muted mb-3">{orders.length ? "Nenhum pedido corresponde aos filtros selecionados." : "Ainda não há pedidos neste estabelecimento."}</p>
            {establishment && !orders.length && <Link className="btn btn-primary" to={`/order/create/${entityId}`}>Criar pedido</Link>}
          </section>
        ) : (
          <section className="card-container table-responsive p-0">
            <table className="table align-middle mb-0">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Consumo</th><th>Pagamento</th><th>Total</th><th>Status</th><th className="text-end">Ações</th></tr></thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.order_number || order.id}</td>
                    <td>{order.customer_name || "Não informado"}</td>
                    <td>{formatDate(order.order_datetime || order.created_at)}</td>
                    <td>{order.fulfillment || "—"}</td>
                    <td><div>{order.payment_method || "—"}</div><small className="text-muted">{order.payment_status || "—"}</small></td>
                    <td>{money(order.total_price)}</td>
                    <td style={{ minWidth: 160 }}>
                      <select className="form-select form-select-sm" value={order.status || "pending"} disabled={updatingId === order.id} onChange={(event) => updateStatus(order, event.target.value)}>
                        <option value="pending">Pendente</option><option value="confirmed">Confirmado</option><option value="preparing">Em preparo</option><option value="ready">Pronto</option><option value="completed">Concluído</option><option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="text-end"><Link className="btn btn-sm btn-secondary" to={`/order/edit/${entityId}/${order.id}`}>Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  );
}

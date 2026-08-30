import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FiArrowLeft, FiBarChart2, FiRefreshCw } from "react-icons/fi";

import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, apiV1BaseUrl, appId } from "../../config";
import "./Report.css";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const localDate = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const localTime = () =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

const safeItems = (order) => (Array.isArray(order?.items) ? order.items : []);
const safeModifiers = (item) => (Array.isArray(item?.modifiers) ? item.modifiers : []);
const itemName = (entry) => entry?.item?.name || entry?.name || `Item ${entry?.item_id || ""}`.trim() || "Item";
const orderTotal = (order) => Number(order?.total_price ?? order?.total ?? 0) || 0;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
};

export default function ReportOrderPage() {
  const { entityId } = useParams();
  const today = localDate();
  const [filters, setFilters] = useState({ startDate: today, startTime: "00:00", endDate: today, endTime: localTime() });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({});
  const [orders, setOrders] = useState([]);
  const [establishment, setEstablishment] = useState(null);

  const loadReport = useCallback(async (selectedFilters) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const periodStart = `${selectedFilters.startDate}T${selectedFilters.startTime}:00`;
    const periodEnd = `${selectedFilters.endDate}T${selectedFilters.endTime}:59`;
    if (new Date(periodStart) > new Date(periodEnd)) {
      await Swal.fire("Período inválido", "A data inicial deve ser anterior à data final.", "warning");
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const { data: contextResponse } = await axios.get(`${apiV1BaseUrl}/me`, { headers });
      const context = contextResponse?.data || {};
      const platEstablishments = Array.isArray(context.establishments)
        ? context.establishments.filter((entry) => Number(entry.app_id) === Number(appId))
        : [];
      const current = platEstablishments.find((entry) => String(entry.id) === String(entityId));
      if (!current) throw new Error("Este estabelecimento não pertence à Plat ou não está disponível para sua conta.");
      setEstablishment(current);

      const { data } = await axios.post(
        `${apiBaseUrl}/report/order`,
        {
          entity_id: entityId,
          entity_name: "establishment",
          period_start: periodStart,
          period_end: periodEnd,
          app_id: appId,
        },
        { headers }
      );

      setReport(data?.report && typeof data.report === "object" ? data.report : {});
      setOrders(Array.isArray(data?.orders) ? data.orders : []);
      setAppliedFilters(selectedFilters);
    } catch (error) {
      setReport({});
      setOrders([]);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Não foi possível carregar o relatório.";
      await Swal.fire("Relatório indisponível", message, "error");
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    loadReport(filters);
    // carregamento inicial apenas; alterações de filtros são aplicadas pelo botão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadReport]);

  const metrics = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + orderTotal(order), 0);
    const cancelled = orders.filter((order) => ["cancelled", "canceled", "cancelado"].includes(String(order?.status || "").toLowerCase())).length;
    const itemQuantity = orders.reduce(
      (sum, order) => sum + safeItems(order).reduce((inner, item) => inner + (Number(item?.quantity) || 0), 0),
      0
    );
    return {
      count: orders.length,
      revenue,
      ticket: orders.length ? revenue / orders.length : 0,
      cancelled,
      cancellationRate: orders.length ? (cancelled / orders.length) * 100 : Number(report?.cancellation_rate || 0),
      avgItems: orders.length ? itemQuantity / orders.length : 0,
    };
  }, [orders, report]);

  const paymentByMethod = useMemo(() => orders.reduce((acc, order) => {
    const key = order?.payment_method || "Não informado";
    acc[key] = (acc[key] || 0) + orderTotal(order);
    return acc;
  }, {}), [orders]);

  const revenueByChannel = useMemo(() => {
    if (report?.revenue_by_channel && typeof report.revenue_by_channel === "object") return report.revenue_by_channel;
    return orders.reduce((acc, order) => {
      const key = order?.origin || order?.channel || "Não informado";
      acc[key] = (acc[key] || 0) + orderTotal(order);
      return acc;
    }, {});
  }, [orders, report]);

  const hourly = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const date = new Date(order?.order_datetime);
      if (Number.isNaN(date.getTime())) return;
      const hour = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(date);
      if (!map[hour]) map[hour] = { count: 0, revenue: 0, items: {} };
      map[hour].count += 1;
      map[hour].revenue += orderTotal(order);
      safeItems(order).forEach((entry) => {
        const name = itemName(entry);
        map[hour].items[name] = (map[hour].items[name] || 0) + (Number(entry?.quantity) || 1);
      });
    });
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b)).map(([hour, value]) => ({
      hour,
      ...value,
      topItem: Object.entries(value.items).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
    }));
  }, [orders]);

  const soldItems = useMemo(() => {
    const map = {};
    orders.forEach((order) => safeItems(order).forEach((entry) => {
      const key = String(entry?.item?.id ?? entry?.item_id ?? itemName(entry));
      if (!map[key]) map[key] = { name: itemName(entry), quantity: 0, revenue: 0, additions: 0 };
      const quantity = Number(entry?.quantity) || 1;
      map[key].quantity += quantity;
      map[key].revenue += Number(entry?.subtotal ?? entry?.total ?? entry?.price ?? 0) || 0;
      map[key].additions += safeModifiers(entry).filter((modifier) => modifier?.type === "addition").length;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const customers = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const phone = order?.customer_phone || order?.phone || order?.customer?.phone || "Sem telefone";
      const key = `${phone}-${order?.customer_name || order?.customer?.name || "Cliente"}`;
      if (!map[key]) map[key] = { name: order?.customer_name || order?.customer?.name || "Cliente", phone, orders: 0, total: 0, lastVisit: null, favorite: {} };
      map[key].orders += 1;
      map[key].total += orderTotal(order);
      const date = new Date(order?.order_datetime);
      if (!Number.isNaN(date.getTime()) && (!map[key].lastVisit || date > map[key].lastVisit)) map[key].lastVisit = date;
      safeItems(order).forEach((entry) => {
        const name = itemName(entry);
        map[key].favorite[name] = (map[key].favorite[name] || 0) + (Number(entry?.quantity) || 1);
      });
    });
    return Object.values(map).map((customer) => ({
      ...customer,
      ticket: customer.orders ? customer.total / customer.orders : 0,
      favorite: Object.entries(customer.favorite).sort((a, b) => b[1] - a[1])[0]?.[0] || "—",
    })).sort((a, b) => b.total - a.total);
  }, [orders]);

  if (loading) {
    return <ProcessingIndicatorComponent messages={["Carregando relatório…", "Consolidando pedidos e indicadores…"]} />;
  }

  return (
    <div className="report-root">
      <NavlogComponent />
      <main className="main-container report-order-main">
        <header className="report-header">
          <div>
            <span className="report-eyebrow"><FiBarChart2 /> Relatórios</span>
            <h1>Relatório de pedidos</h1>
            <p>{establishment?.name || "Estabelecimento"} · visão consolidada da operação.</p>
          </div>
          <Link className="btn btn-secondary" to={`/order/list/${entityId}`}><FiArrowLeft /> Voltar aos pedidos</Link>
        </header>

        <section className="report-filter-card" aria-label="Período do relatório">
          <div className="report-filter-grid">
            {[
              ["Data inicial", "startDate", "date"],
              ["Hora inicial", "startTime", "time"],
              ["Data final", "endDate", "date"],
              ["Hora final", "endTime", "time"],
            ].map(([label, key, type]) => (
              <label key={key}>
                <span>{label}</span>
                <input type={type} value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} />
              </label>
            ))}
            <button type="button" className="btn btn-primary report-apply" onClick={() => loadReport(filters)}>
              <FiRefreshCw /> Atualizar relatório
            </button>
          </div>
          {appliedFilters && <small>Período aplicado: {appliedFilters.startDate} {appliedFilters.startTime} até {appliedFilters.endDate} {appliedFilters.endTime}</small>}
        </section>

        <section className="report-kpis">
          <article><span>Pedidos</span><strong>{metrics.count}</strong><small>No período selecionado</small></article>
          <article><span>Receita</span><strong>{money(report?.cash_flow ?? metrics.revenue)}</strong><small>Faturamento consolidado</small></article>
          <article><span>Ticket médio</span><strong>{money(metrics.ticket)}</strong><small>Valor médio por pedido</small></article>
          <article><span>Cancelamentos</span><strong>{metrics.cancellationRate.toFixed(1)}%</strong><small>{metrics.cancelled} pedido(s)</small></article>
        </section>

        {orders.length === 0 ? (
          <section className="report-empty">
            <FiBarChart2 />
            <h2>Nenhum pedido neste período</h2>
            <p>Altere o período acima ou registre pedidos para começar a visualizar os indicadores.</p>
          </section>
        ) : (
          <>
            <section className="report-grid report-grid--2">
              <article className="report-card">
                <header><h2>Resumo financeiro</h2></header>
                <div className="report-stat-grid">
                  <div><span>Fluxo de caixa</span><strong>{money(report?.cash_flow ?? metrics.revenue)}</strong></div>
                  <div><span>Lucro bruto</span><strong>{money(report?.gross_profit)}</strong></div>
                  <div><span>Lucro líquido</span><strong>{money(report?.net_profit)}</strong></div>
                  <div><span>Despesas</span><strong>{money(report?.total_expenses)}</strong></div>
                </div>
              </article>
              <article className="report-card">
                <header><h2>Operacional</h2></header>
                <div className="report-stat-grid">
                  <div><span>Média itens/pedido</span><strong>{metrics.avgItems.toFixed(2)}</strong></div>
                  <div><span>Tempo médio</span><strong>{Number(report?.avg_service_time || 0)}s</strong></div>
                  <div><span>Novos clientes</span><strong>{Number(report?.new_customers_count || 0)}</strong></div>
                  <div><span>Retornantes</span><strong>{Number(report?.returning_customers_count || 0)}</strong></div>
                </div>
              </article>
            </section>

            <section className="report-grid report-grid--2">
              <article className="report-card"><header><h2>Pagamento por método</h2></header><div className="report-mini-list">{Object.entries(paymentByMethod).map(([key, value]) => <div key={key}><span>{key}</span><strong>{money(value)}</strong></div>)}</div></article>
              <article className="report-card"><header><h2>Receita por canal</h2></header><div className="report-mini-list">{Object.entries(revenueByChannel).map(([key, value]) => <div key={key}><span>{key}</span><strong>{money(value)}</strong></div>)}</div></article>
            </section>

            <section className="report-card">
              <header><h2>Pedidos por hora</h2><span>{hourly.length} faixa(s)</span></header>
              <div className="report-table-wrap"><table><thead><tr><th>Hora</th><th>Pedidos</th><th>%</th><th>Receita</th><th>Ticket médio</th><th>Item mais vendido</th></tr></thead><tbody>{hourly.map((row) => <tr key={row.hour}><td>{row.hour}:00</td><td>{row.count}</td><td>{((row.count / metrics.count) * 100).toFixed(1)}%</td><td>{money(row.revenue)}</td><td>{money(row.revenue / row.count)}</td><td>{row.topItem}</td></tr>)}</tbody></table></div>
            </section>

            <section className="report-card">
              <header><h2>Itens vendidos</h2><span>{soldItems.length} item(ns)</span></header>
              <div className="report-table-wrap"><table><thead><tr><th>Item</th><th>Quantidade</th><th>Receita</th><th>Média por unidade</th><th>Adicionais</th><th>% da receita</th></tr></thead><tbody>{soldItems.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.revenue)}</td><td>{money(item.quantity ? item.revenue / item.quantity : 0)}</td><td>{item.additions}</td><td>{metrics.revenue ? ((item.revenue / metrics.revenue) * 100).toFixed(1) : "0.0"}%</td></tr>)}</tbody></table></div>
            </section>

            <section className="report-card">
              <header><h2>Clientes</h2><span>{customers.length} cliente(s)</span></header>
              <div className="report-table-wrap"><table><thead><tr><th>#</th><th>Cliente</th><th>Telefone</th><th>Pedidos</th><th>Total</th><th>Ticket médio</th><th>Última visita</th><th>Item favorito</th></tr></thead><tbody>{customers.map((customer, index) => <tr key={`${customer.phone}-${customer.name}`}><td>{index + 1}</td><td>{customer.name}</td><td>{customer.phone}</td><td>{customer.orders}</td><td>{money(customer.total)}</td><td>{money(customer.ticket)}</td><td>{formatDateTime(customer.lastVisit)}</td><td>{customer.favorite}</td></tr>)}</tbody></table></div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

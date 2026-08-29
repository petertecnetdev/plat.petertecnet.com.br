import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiClipboard,
  FiDollarSign,
  FiEdit3,
  FiExternalLink,
  FiPlus,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import NavlogComponent from "../components/NavlogComponent";
import ProcessingIndicatorComponent from "../components/ProcessingIndicatorComponent";
import { apiBaseUrl, storageUrl } from "../config";
import "./Dashboard.css";

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [establishments, setEstablishments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
        const ests = data.establishments || [];
        setUser(data.user || null);
        setEstablishments(ests);

        const today = new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Sao_Paulo",
        });

        const results = await Promise.all(
          ests.map(async (est) => {
            let rawOrders = [];
            try {
              const response = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
                params: { app_id: 3, entity_name: "establishment", entity_id: est.id },
                headers,
              });
              rawOrders = Array.isArray(response.data?.orders) ? response.data.orders : [];
            } catch (error) {
              if (error.response?.status !== 404) throw error;
            }

            const orders = rawOrders.filter((order) => {
              if (!order.order_datetime) return false;
              return new Date(order.order_datetime).toLocaleDateString("en-CA", {
                timeZone: "America/Sao_Paulo",
              }) === today;
            });

            const orderValue = (order) =>
              (order.items || []).reduce((sum, entry) => {
                let subtotal = Number(entry.subtotal || 0);
                (entry.modifiers || [])
                  .filter((modifier) => modifier.type === "addition")
                  .forEach((modifier) => {
                    const product = data.items?.find((item) => item.id === modifier.modifier_id);
                    subtotal += (product ? Number(product.price || 0) : 0) * (modifier.quantity || 1);
                  });
                return sum + subtotal;
              }, 0);

            const totalValue = orders.reduce((sum, order) => sum + orderValue(order), 0);
            const itemCounts = {};
            const customerSums = {};

            orders.forEach((order) => {
              (order.items || []).forEach((entry) => {
                const itemName = entry.item?.name || "Item";
                itemCounts[itemName] = (itemCounts[itemName] || 0) + Number(entry.quantity || 0);
              });
              const customer = order.customer_name || "Cliente";
              customerSums[customer] = (customerSums[customer] || 0) + orderValue(order);
            });

            const mostOrderedItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
            const topCustomer = Object.entries(customerSums).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
            const totalOrders = orders.length;

            return [est.id, {
              totalOrders,
              totalValue,
              avgTicket: totalOrders ? totalValue / totalOrders : 0,
              mostOrderedItem,
              topCustomer,
            }];
          })
        );

        setMetrics(Object.fromEntries(results));
      } catch (error) {
        console.error("Dashboard load error:", error);
        Swal.fire({
          icon: "error",
          title: "Não foi possível carregar a operação",
          text: "Tente novamente em instantes.",
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totals = useMemo(() => {
    const values = Object.values(metrics);
    const totalOrders = values.reduce((sum, metric) => sum + Number(metric.totalOrders || 0), 0);
    const revenue = values.reduce((sum, metric) => sum + Number(metric.totalValue || 0), 0);
    return {
      totalOrders,
      revenue,
      avgTicket: totalOrders ? revenue / totalOrders : 0,
      establishments: establishments.length,
    };
  }, [metrics, establishments.length]);

  const firstEstablishment = establishments[0];
  const firstName = user?.first_name || user?.name?.split(" ")?.[0] || "";
  const greeting = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  if (isLoading) {
    return <ProcessingIndicatorComponent messages={["Carregando sua operação…", "Organizando os indicadores de hoje…"]} />;
  }

  return (
    <div className="dashboard-root">
      <NavlogComponent />
      <main className="dashboard-main">
        <header className="dashboard-hero">
          <div>
            <span className="dashboard-eyebrow">Visão geral</span>
            <h1>{greeting}{firstName ? `, ${firstName}` : ""}.</h1>
            <p>Acompanhe o desempenho de hoje e acesse rapidamente sua operação.</p>
          </div>
          <div className="dashboard-hero__actions">
            <span className="dashboard-date">
              {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}
            </span>
            <Link to="/establishment/create" className="dashboard-primary-action"><FiPlus /> Novo estabelecimento</Link>
          </div>
        </header>

        <section className="dashboard-kpis" aria-label="Indicadores de hoje">
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__icon is-gold"><FiDollarSign /></span>
            <div><span>Receita de hoje</span><strong>{money(totals.revenue)}</strong><small>Somando seus estabelecimentos</small></div>
          </article>
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__icon is-blue"><FiShoppingBag /></span>
            <div><span>Pedidos hoje</span><strong>{totals.totalOrders}</strong><small>Pedidos registrados hoje</small></div>
          </article>
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__icon is-green"><FiTrendingUp /></span>
            <div><span>Ticket médio</span><strong>{money(totals.avgTicket)}</strong><small>Média dos pedidos de hoje</small></div>
          </article>
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__icon is-purple"><FiBriefcase /></span>
            <div><span>Estabelecimentos</span><strong>{totals.establishments}</strong><small>Vinculados à sua conta</small></div>
          </article>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-panel dashboard-panel--establishments">
            <div className="dashboard-panel__header">
              <div><span className="dashboard-eyebrow">Operação</span><h2>Estabelecimentos</h2></div>
              <Link to="/establishment">Ver todos <FiArrowRight /></Link>
            </div>

            {establishments.length === 0 ? (
              <div className="dashboard-empty">
                <span><FiBriefcase /></span>
                <h3>Sua operação começa aqui</h3>
                <p>Cadastre seu primeiro estabelecimento para começar a gerenciar pedidos, itens e indicadores.</p>
                <Link to="/establishment/create"><FiPlus /> Criar estabelecimento</Link>
              </div>
            ) : (
              <div className="dashboard-establishments">
                {establishments.map((est) => {
                  const metric = metrics[est.id] || {};
                  return (
                    <article className="dashboard-establishment" key={est.id}>
                      <div className="dashboard-establishment__head">
                        <img
                          src={`${storageUrl}/${est.logo || "logo.png"}`}
                          alt=""
                          onError={(event) => { event.currentTarget.src = "/images/logo.png"; }}
                        />
                        <div>
                          <h3>{est.name}</h3>
                          <span>@{est.slug}</span>
                        </div>
                        <Link to={`/establishment/view/${est.slug}`} aria-label={`Abrir página de ${est.name}`}><FiExternalLink /></Link>
                      </div>

                      <div className="dashboard-establishment__numbers">
                        <div><span>Pedidos hoje</span><strong>{metric.totalOrders || 0}</strong></div>
                        <div><span>Receita hoje</span><strong>{money(metric.totalValue)}</strong></div>
                        <div><span>Ticket médio</span><strong>{money(metric.avgTicket)}</strong></div>
                      </div>

                      <div className="dashboard-establishment__insights">
                        <span><small>Mais pedido</small><strong>{metric.mostOrderedItem || "—"}</strong></span>
                        <span><small>Cliente destaque</small><strong>{metric.topCustomer || "—"}</strong></span>
                      </div>

                      <div className="dashboard-establishment__actions">
                        <Link to={`/order/create/${est.id}`}><FiPlus /> Pedido</Link>
                        <Link to={`/order/list/${est.id}`}><FiShoppingBag /> Pedidos</Link>
                        <Link to={`/item/list/${est.slug}`}><FiClipboard /> Itens</Link>
                        <Link to={`/report/order/${est.id}`}><FiBarChart2 /> Relatório</Link>
                        <Link to={`/establishment/update/${est.id}`}><FiEdit3 /> Editar</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="dashboard-side">
            <div className="dashboard-panel">
              <div className="dashboard-panel__header"><div><span className="dashboard-eyebrow">Atalhos</span><h2>Ações rápidas</h2></div></div>
              <div className="dashboard-quick-actions">
                {firstEstablishment ? (
                  <>
                    <Link to={`/order/create/${firstEstablishment.id}`}><span><FiShoppingBag /></span><div><strong>Novo pedido</strong><small>Registrar uma nova venda</small></div><FiArrowRight /></Link>
                    <Link to={`/item/list/${firstEstablishment.slug}`}><span><FiClipboard /></span><div><strong>Gerenciar itens</strong><small>Produtos e serviços</small></div><FiArrowRight /></Link>
                    <Link to={`/report/order/${firstEstablishment.id}`}><span><FiBarChart2 /></span><div><strong>Relatório de pedidos</strong><small>Veja o desempenho</small></div><FiArrowRight /></Link>
                  </>
                ) : (
                  <Link to="/establishment/create"><span><FiBriefcase /></span><div><strong>Criar estabelecimento</strong><small>Configure sua primeira operação</small></div><FiArrowRight /></Link>
                )}
              </div>
            </div>

            <div className="dashboard-panel dashboard-summary">
              <span className="dashboard-eyebrow">Resumo do dia</span>
              <h2>Operação de hoje</h2>
              <div className="dashboard-summary__row"><span>Receita</span><strong>{money(totals.revenue)}</strong></div>
              <div className="dashboard-summary__row"><span>Pedidos</span><strong>{totals.totalOrders}</strong></div>
              <div className="dashboard-summary__row"><span>Ticket médio</span><strong>{money(totals.avgTicket)}</strong></div>
              <div className="dashboard-summary__bar"><i style={{ width: totals.totalOrders ? "72%" : "8%" }} /></div>
              <small>Indicadores calculados com os registros disponíveis para hoje.</small>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

// src/pages/report/ReportOrderPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Form,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";
import "./Report.css";

export default function ReportOrderPage() {
  const { entityId } = useParams();
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [orders, setOrders] = useState([]);

  const [filters, setFilters] = useState({
    startDate: today,
    startTime: "00:00",
    endDate: today,
    endTime: nowTime,
  });
  const [sortKey, setSortKey] = useState("total");
const [sortOrder, setSortOrder] = useState("desc");


  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const period_start = `${filters.startDate}T${filters.startTime}:00`;
      const period_end = `${filters.endDate}T${filters.endTime}:59`;
      const { data } = await axios.post(
        `${apiBaseUrl}/report/order`,
        { entity_id: entityId, entity_name: "establishment", period_start, period_end },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(data.report);
      setOrders(data.orders);
    } catch (err) {
      Swal.fire("Erro", err.response?.data?.message || "Não foi possível carregar o relatório.", "error");
    } finally {
      setLoading(false);
    }
  }, [entityId, filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading || !report) {
    return (
      <Container fluid className="report-order-page text-center mt-5">
        <Spinner animation="border" />
        <p>Carregando relatório...</p>
      </Container>
    );
  }

  const paymentByMethod = orders.reduce((acc, o) => {
    const m = o.payment_method || "Outro";
    acc[m] = (acc[m] || 0) + Number(o.total_price);
    return acc;
  }, {});

  const ordersByHour = Object.entries(
    orders.reduce((acc, o) => {
      const h = new Date(o.order_datetime).getHours();
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => a[0] - b[0]);

console.log('report:', report);
console.log('report.top_customers:', report?.top_customers);
console.log('orders:', orders);

const clientesMap = {};
orders.forEach((o) => {
  const phone = o.customer_phone || o.phone || o.customer?.phone || "—";
  if (!clientesMap[phone]) {
    clientesMap[phone] = {
      name: o.customer_name || o.name || o.customer?.name || "—",
      phone,
      orders: [],
    };
  }
  clientesMap[phone].orders.push(o);
});
const clientesArr = Object.values(clientesMap).map((c) => {
  const pedidos = c.orders.length;
  const total = c.orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
  return {
    ...c,
    pedidos,
    total,
  };
});

// Ordenação dinâmica:
const sortedClients = [...clientesArr].sort((a, b) => {
  if (sortOrder === "asc") {
    return a[sortKey] > b[sortKey] ? 1 : -1;
  }
  return a[sortKey] < b[sortKey] ? 1 : -1;
});
const customerStats = sortedClients.map((c, i) => ({
  ...c,
  rank: i + 1,
}));




  return (
    <div className="report-order-page">
      <NavlogComponent />
      <Container fluid className="mt-4">

        <Row className="mb-3">
          <Col><h3>Relatório de Pedidos</h3></Col>
          <Col className="text-end">
            <Link to={`/order/list/${entityId}`}>← Voltar aos Pedidos</Link>
          </Col>
        </Row>

        <Card className="mb-4 period-card">
          <Card.Body>
            <Row className="g-3">
              {[
                { label: "Data Início", key: "startDate", type: "date" },
                { label: "Hora Início", key: "startTime", type: "time" },
                { label: "Data Fim", key: "endDate", type: "date" },
                { label: "Hora Fim", key: "endTime", type: "time" },
              ].map(f => (
                <Col md={3} key={f.key}>
                  <Form.Label>{f.label}</Form.Label>
                  <Form.Control
                    type={f.type}
                    value={filters[f.key]}
                    onChange={e => setFilters(s => ({ ...s, [f.key]: e.target.value }))}
                  />
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4 shadow-sm">
          <Card.Header>Resumo Financeiro</Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <strong>Fluxo de Caixa</strong>
                <div>R${Number(report.cash_flow).toFixed(2)}</div>
              </Col>
              <Col md={3}>
                <strong>Lucro Bruto</strong>
                <div>R${Number(report.gross_profit).toFixed(2)}</div>
              </Col>
              <Col md={3}>
                <strong>Lucro Líquido</strong>
                <div>R${Number(report.net_profit).toFixed(2)}</div>
              </Col>
              <Col md={3}>
                <strong>Despesas Totais</strong>
                <div>R${Number(report.total_expenses).toFixed(2)}</div>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col md={6}>
                <strong>Pagamento por Método</strong>
                <Table size="sm" bordered className="styled-table">
                  <tbody>
                    {Object.entries(paymentByMethod).map(([m, v]) => (
                      <tr key={m}>
                        <td>{m}</td>
                        <td>R${Number(v).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <strong>Receita por Canal</strong>
                <Table size="sm" bordered className="styled-table">
                  <tbody>
                    {Object.entries(report.revenue_by_channel).map(([ch, val]) => (
                      <tr key={ch}>
                        <td>{ch}</td>
                        <td>R${Number(val).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        <Card className="mb-4 shadow-sm">
          <Card.Header>Operacional</Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <strong>Taxa de Cancelamento</strong>
                <div>{report.cancellation_rate}% ({orders.filter(o => o.status === 'cancelled').length} cancelamentos)</div>
              </Col>
              <Col md={4}>
                <strong>Média Itens/Pedido</strong>
                <div>{(orders.reduce((sum, o) => sum + o.items.length, 0) / orders.length).toFixed(2)}</div>
              </Col>
              <Col md={4}>
                <strong>Tempo Médio Serviço</strong>
                <div>{report.avg_service_time} seg</div>
              </Col>
            </Row>
            <hr />
            <Row>
              <Col md={3}>
                <strong>Utilização de Recursos</strong>
                <div>{report.resource_utilization}%</div>
              </Col>
              <Col md={3}>
                <strong>Eficiência da Equipe</strong>
                <div>{report.labor_efficiency}%</div>
              </Col>
              <Col md={3}>
                <strong>Novos Clientes</strong>
                <div>{report.new_customers_count}</div>
              </Col>
              <Col md={3}>
                <strong>Clientes Retornantes</strong>
                <div>{report.returning_customers_count}</div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-4 shadow-sm">
          <Card.Header>Pedidos por Hora</Card.Header>
          <Card.Body>
            <Table bordered className="styled-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Qtd</th>
                  <th>% Total</th>
                  <th>Receita (R$)</th>
                  <th>Ticket Médio (R$)</th>
                  <th>Item Mais Vendido</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalOrders = orders.length;
                  const hourData = ordersByHour.map(([h, cnt]) => {
                    const byHour = orders.filter(o => new Date(o.order_datetime).getHours() === +h);
                    const revenue = byHour.reduce((sum, o) => sum + Number(o.total_price), 0);
                    const avgTicket = revenue / cnt;
                    const itemCounts = byHour
                      .flatMap(o => o.items)
                      .reduce((acc, it) => {
                        const name = it.item.name;
                        acc[name] = (acc[name] || 0) + it.quantity;
                        return acc;
                      }, {});
                    const topItem = Object.entries(itemCounts)
                      .sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
                    return { hour: h, cnt, revenue, avgTicket, topItem };
                  });
                  const peakHour = hourData.reduce((m, x) => x.cnt > m.cnt ? x : m, { cnt: 0 }).hour;
                  return hourData.map(d => (
                    <tr key={d.hour} className={d.hour === peakHour ? "peak-hour-row" : ""}>
                      <td>{d.hour}:00</td>
                      <td>{d.cnt}</td>
                      <td>{((d.cnt / totalOrders) * 100).toFixed(1)}%</td>
                      <td>R${Number(d.revenue).toFixed(2)}</td>
                      <td>R${Number(d.avgTicket).toFixed(2)}</td>
                      <td>{d.topItem}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </Table>
            <p>
              <em>
                Hora de pico:{" "}
                <strong>
                  {ordersByHour.reduce((m, [h, c]) => c > m[1] ? [h, c] : m, [null,0])[0]}
                  :00
                </strong>
              </em>
            </p>
          </Card.Body>
        </Card>
        <Card className="mb-4 shadow-sm">
  <Card.Header>Itens Mais Adicionados</Card.Header>
  <Card.Body>
    {(() => {
      const addEvents = orders
        .flatMap(o =>
          o.items.flatMap(it =>
            it.modifiers
              .filter(m => m.type === "addition")
              .map(m => ({
                name: m.modifier.name,
                datetime: o.order_datetime,
                customer: o.customer_name,
                orderNumber: o.order_number,
                revenue: it.subtotal,
              }))
          )
        );

      if (addEvents.length === 0) {
        return <p>Nenhum item adicionado.</p>;
      }

      const counts = addEvents.reduce((acc, ev) => {
        acc[ev.name] = acc[ev.name] || [];
        acc[ev.name].push(ev);
        return acc;
      }, {});

      const itemsSorted = Object.entries(counts).sort((a, b) => b[1].length - a[1].length);
      const [topName, topEvents] = itemsSorted[0];

      // Detalhe do item mais adicionado (destacado)
      const totalAdditions = topEvents.length;
      const totalRevenue = topEvents.reduce((sum, ev) => sum + Number(ev.revenue || 0), 0);
      const avgRevenue = totalAdditions ? totalRevenue / totalAdditions : 0;
      const hourCounts = topEvents.reduce((acc, ev) => {
        const h = new Date(ev.datetime).getHours();
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {});
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const custCounts = topEvents.reduce((acc, ev) => {
        acc[ev.customer] = (acc[ev.customer] || 0) + 1;
        return acc;
      }, {});
      const topCustomer = Object.entries(custCounts).sort((a, b) => b[1] - a[1])[0];

      return (
        <>
          {/* Destaque do mais adicionado */}
          <Row>
            <Col md={4}>
              <strong>Item:</strong> {topName}
            </Col>
            <Col md={2}>
              <strong>Total Adições:</strong> {totalAdditions}
            </Col>
            <Col md={3}>
              <strong>Receita Total:</strong> R${Number(totalRevenue).toFixed(2)}
            </Col>
            <Col md={3}>
              <strong>Ticket Médio:</strong> R${Number(avgRevenue).toFixed(2)}
            </Col>
          </Row>
          <Row className="mt-2">
            <Col md={4}>
              <strong>Hora de Pico:</strong> {peakHour}:00
            </Col>
            <Col md={4}>
              <strong>Cliente Top:</strong> {topCustomer?.[0] || "—"} {topCustomer ? `(${topCustomer[1]} vezes)` : ""}
            </Col>
            <Col md={4}>
              <strong>Último Pedido:</strong> #{topEvents[topEvents.length - 1].orderNumber}
            </Col>
          </Row>

          {/* Tabela detalhada de todos os itens */}
          <hr className="my-4" />
          <div style={{ overflowX: 'auto' }}>
            <Table bordered size="sm" className="styled-table mt-3">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Total Adições</th>
                  <th>Receita Total (R$)</th>
                  <th>Ticket Médio (R$)</th>
                  <th>Hora de Pico</th>
                  <th>Cliente Top</th>
                  <th>Último Pedido</th>
                </tr>
              </thead>
              <tbody>
                {itemsSorted.map(([name, events]) => {
                  const totalAdd = events.length;
                  const totalRev = events.reduce((sum, ev) => sum + Number(ev.revenue || 0), 0);
                  const avgRev = totalAdd ? totalRev / totalAdd : 0;
                  const hourC = events.reduce((acc, ev) => {
                    const h = new Date(ev.datetime).getHours();
                    acc[h] = (acc[h] || 0) + 1;
                    return acc;
                  }, {});
                  const peakH = Object.entries(hourC).sort((a, b) => b[1] - a[1])[0]?.[0];
                  const custC = events.reduce((acc, ev) => {
                    acc[ev.customer] = (acc[ev.customer] || 0) + 1;
                    return acc;
                  }, {});
                  const topC = Object.entries(custC).sort((a, b) => b[1] - a[1])[0];
                  const lastOrder = events[events.length - 1]?.orderNumber || "—";

                  return (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{totalAdd}</td>
                      <td>R${Number(totalRev).toFixed(2)}</td>
                      <td>R${Number(avgRev).toFixed(2)}</td>
                      <td>{peakH}:00</td>
                      <td>{topC?.[0] || "—"} {topC ? `(${topC[1]} vezes)` : ""}</td>
                      <td>#{lastOrder}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      );
    })()}
  </Card.Body>
</Card>

        <Card className="mb-4 shadow-sm">
  <Card.Header>Itens Vendidos</Card.Header>
  <Card.Body>
    <Table bordered className="styled-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qtd</th>
          <th>Subtotal (R$)</th>
          <th>Ticket Médio (R$)</th>
          <th>% Qtd</th>
          <th>% Receita</th>
          <th>Qtd. Combo</th>
          <th>Qtd. Adicionais</th>
          <th>Hora de Pico</th>
          <th>Cliente Top</th>
          <th>Último Pedido</th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          const allOrderItems = orders.flatMap(o =>
            o.items.map(it => ({
              ...it,
              order_datetime: o.order_datetime,
              customer_name: o.customer_name,
              order_number: o.order_number,
              modifiers: it.modifiers || [],
              isCombo: it.is_combo || it.combo || false,
            }))
          );
          const totalQtd = Object.values(report.breakdown_by_item).reduce((sum, i) => sum + Number(i.quantity), 0);
          const totalSub = Object.values(report.breakdown_by_item).reduce((sum, i) => sum + Number(i.subtotal), 0);

          return Object.entries(report.breakdown_by_item).map(([id, info]) => {
            const matching = allOrderItems.filter(it => String(it.item.id) === String(id));
            const qtd = Number(info.quantity);
            const subtotal = Number(info.subtotal);
            const avgTicket = qtd ? subtotal / qtd : 0;
            const percentQtd = totalQtd ? (qtd / totalQtd) * 100 : 0;
            const percentSub = totalSub ? (subtotal / totalSub) * 100 : 0;

            // Qtd combos (separado)
            const qtdCombo = matching.filter(it => it.isCombo).reduce((s, it) => s + (Number(it.quantity) || 0), 0);

            // Qtd adicionais (conta todas adições associadas)
            const qtdAdicionais = matching
              .flatMap(it => it.modifiers)
              .filter(m => m.type === "addition").length;

            // Hora de pico
            const hourCounts = matching.reduce((acc, it) => {
              const h = new Date(it.order_datetime).getHours();
              acc[h] = (acc[h] || 0) + (Number(it.quantity) || 1);
              return acc;
            }, {});
            const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

            // Cliente Top
            const custCounts = matching.reduce((acc, it) => {
              acc[it.customer_name] = (acc[it.customer_name] || 0) + (Number(it.quantity) || 1);
              return acc;
            }, {});
            const topCustomer = Object.entries(custCounts).sort((a, b) => b[1] - a[1])[0];

            // Último pedido
            const lastOrder = matching.sort((a, b) =>
              new Date(a.order_datetime) - new Date(b.order_datetime)
            )[matching.length - 1]?.order_number || "—";

            return (
              <tr key={id}>
                <td>{matching[0]?.item?.name || id}</td>
                <td>{qtd}</td>
                <td>R${subtotal.toFixed(2)}</td>
                <td>R${avgTicket.toFixed(2)}</td>
                <td>{percentQtd.toFixed(1)}%</td>
                <td>{percentSub.toFixed(1)}%</td>
                <td>{qtdCombo}</td>
                <td>{qtdAdicionais}</td>
                <td>{peakHour ? `${peakHour}:00` : "—"}</td>
                <td>
                  {topCustomer?.[0] || "—"}
                  {topCustomer ? ` (${topCustomer[1]})` : ""}
                </td>
                <td>#{lastOrder}</td>
              </tr>
            );
          });
        })()}
      </tbody>
    </Table>
  </Card.Body>
</Card>
<Card className="mb-4 shadow-sm">
  <Card.Header>Top Clientes</Card.Header>
  <Card.Body>
    <Table bordered className="styled-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Pedidos</th>
          <th style={{cursor: "pointer"}} onClick={() => {
  setSortKey("total");
  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
}}>
  Total (R$) {sortKey === "total" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
</th>

          <th>Ticket Médio</th>
          <th>Última Visita</th>
          <th>Primeira Visita</th>
          <th>Tempo Médio Entre Pedidos</th>
          <th>Qtd Combos</th>
          <th>Qtd Adicionais</th>
          <th>Item Favorito</th>
          <th>Horário Preferido</th>
          <th>Maior Pedido (R$)</th>
          <th>Valor Médio por Pedido</th>
          <th>% Faturamento</th>
        </tr>
      </thead>
      <tbody>
        {(() => {
          const allOrders = orders;
          const totalFaturamento = allOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);

          return customerStats.map(c => {
           const customerOrders = allOrders.filter(
  o =>
    (o.customer_phone || o.phone || (o.customer && o.customer.phone) || "—") === c.phone
);

            const pedidos = customerOrders.length;
            const total = customerOrders.reduce((sum, o) => sum + Number(o.total_price || 0), 0);
            const ticketMedio = pedidos ? total / pedidos : 0;

            // Datas das visitas
            const sortedByDate = customerOrders
              .map(o => ({ ...o, date: new Date(o.order_datetime) }))
              .sort((a, b) => a.date - b.date);
            const primeiraVisita = sortedByDate[0]?.date;
            const ultimaVisita = sortedByDate[pedidos - 1]?.date;
            const ultimoCanal = sortedByDate[pedidos - 1]?.origin || "—";

            // Tempo médio entre pedidos
            let tempoMedio = null;
            if (pedidos > 1) {
              let sumIntervals = 0;
              for (let j = 1; j < sortedByDate.length; j++) {
                sumIntervals += (sortedByDate[j].date - sortedByDate[j - 1].date);
              }
              tempoMedio = sumIntervals / (pedidos - 1);
            }

            // Qtd combos e adicionais
            const qtdCombos = customerOrders
              .flatMap(o => o.items)
              .filter(it => it.is_combo || it.combo)
              .reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

            const qtdAdicionais = customerOrders
              .flatMap(o => o.items)
              .flatMap(it => it.modifiers || [])
              .filter(m => m.type === "addition").length;

            // Item favorito
            const favItemCount = {};
            customerOrders.forEach(o =>
              o.items.forEach(it => {
                favItemCount[it.item.name] = (favItemCount[it.item.name] || 0) + (Number(it.quantity) || 1);
              })
            );
            const favItem = Object.entries(favItemCount).sort((a, b) => b[1] - a[1])[0];

            // Horário preferido
            const hourCount = {};
            customerOrders.forEach(o => {
              const h = new Date(o.order_datetime).getHours();
              hourCount[h] = (hourCount[h] || 0) + 1;
            });
            const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];

            // Maior pedido
            const maiorPedido = customerOrders.reduce((max, o) => Number(o.total_price) > max ? Number(o.total_price) : max, 0);

            // Valor médio por pedido (reforçado)
            const valorMedio = ticketMedio;

            // % participação faturamento
            const percentFaturamento = totalFaturamento ? (total / totalFaturamento) * 100 : 0;

            // Helpers
            function formatDate(dt) {
              if (!dt) return "—";
              return dt.toLocaleDateString() + " " + dt.toLocaleTimeString().slice(0, 5);
            }
            function formatInterval(ms) {
              if (!ms) return "—";
              const h = Math.floor(ms / 1000 / 60 / 60);
              const d = Math.floor(h / 24);
              const hR = h % 24;
              if (d > 0) return `${d}d ${hR}h`;
              if (hR > 0) return `${hR}h`;
              const m = Math.floor((ms / 1000 / 60) % 60);
              if (m > 0) return `${m}min`;
              return "<1min";
            }

            return (
              <tr key={c.phone}>
                <td>{c.rank}</td>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{pedidos}</td>
                <td>R${total.toFixed(2)}</td>
                <td>R${ticketMedio.toFixed(2)}</td>
                <td>
                  {formatDate(ultimaVisita)}<br />
                  <small>({ultimoCanal})</small>
                </td>
                <td>{formatDate(primeiraVisita)}</td>
                <td>{formatInterval(tempoMedio)}</td>
                <td>{qtdCombos}</td>
                <td>{qtdAdicionais}</td>
                <td>
                  {favItem?.[0] || "—"}
                  {favItem ? ` (${favItem[1]})` : ""}
                </td>
                <td>
                  {peakHour?.[0] ? `${peakHour[0]}:00` : "—"}
                  {peakHour ? ` (${peakHour[1]})` : ""}
                </td>
                <td>R${maiorPedido.toFixed(2)}</td>
                <td>R${valorMedio.toFixed(2)}</td>
                <td>{percentFaturamento.toFixed(1)}%</td>
              </tr>
            );
          });
        })()}
      </tbody>
    </Table>
  </Card.Body>
</Card>

      </Container>
    </div>
  );
}

// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NavlogComponent from '../components/NavlogComponent';
import Swal from 'sweetalert2';
import { apiBaseUrl, storageUrl } from '../config';
import './Dashboard.css';

export default function Dashboard() {
  const [establishments, setEstablishments] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  (async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ests = data.establishments || [];
      setEstablishments(ests);

      const today = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Sao_Paulo',
      });

      const results = await Promise.all(
        ests.map(async (est) => {
          // 1) tenta buscar orders, mas não falha se 404 ou array vazia
          let rawOrders = [];
          try {
            const res = await axios.get(`${apiBaseUrl}/order/listbyentity`, {
              params: {
                app_id: 3,
                entity_name: 'establishment',
                entity_id: est.id,
              },
              headers: { Authorization: `Bearer ${token}` },
            });
            rawOrders = Array.isArray(res.data.orders) ? res.data.orders : [];
          } catch (err) {
            if (err.response?.status === 404) {
              rawOrders = [];
            } else {
              throw err;
            }
          }

          // 2) filtra pelo dia de hoje
          const orders = rawOrders.filter((o) => {
            const date = new Date(o.order_datetime).toLocaleDateString(
              'en-CA',
              { timeZone: 'America/Sao_Paulo' }
            );
            return date === today;
          });

          // 3) calcula métricas
          const totalOrders = orders.length;
          const totalValue = orders.reduce((sum, o) => {
            const orderSum = o.items.reduce((s, it) => {
              let sub = Number(it.subtotal);
              it.modifiers
                .filter((m) => m.type === 'addition')
                .forEach((m) => {
                  const prod = data.items?.find((p) => p.id === m.modifier_id);
                  sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                });
              return s + sub;
            }, 0);
            return sum + orderSum;
          }, 0);

          const itemCounts = {};
          orders.forEach((o) =>
            o.items.forEach((it) => {
              itemCounts[it.item.name] = (itemCounts[it.item.name] || 0) + it.quantity;
            })
          );
          const mostOrderedItem =
            Object.entries(itemCounts).reduce(
              (max, [name, qty]) => (qty > max[1] ? [name, qty] : max),
              ['', 0]
            )[0] || '-';

          const customerSums = {};
          orders.forEach((o) => {
            const sum = o.items.reduce((s, it) => {
              let sub = Number(it.subtotal);
              it.modifiers
                .filter((m) => m.type === 'addition')
                .forEach((m) => {
                  const prod = data.items?.find((p) => p.id === m.modifier_id);
                  sub += (prod ? Number(prod.price) : 0) * (m.quantity || 1);
                });
              return s + sub;
            }, 0);
            customerSums[o.customer_name] = (customerSums[o.customer_name] || 0) + sum;
          });
          const topCustomer =
            Object.entries(customerSums).reduce(
              (max, [name, sum]) => (sum > max[1] ? [name, sum] : max),
              ['', 0]
            )[0] || '-';

          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const now = new Date();
          const hoursElapsed = Math.max((now - start) / 36e5, 1);
          const avgOrdersPerHour = (totalOrders / hoursElapsed).toFixed(2);
          const avgTicket = totalOrders
            ? (totalValue / totalOrders).toFixed(2)
            : '0.00';

          return [
            est.id,
            {
              totalOrders,
              totalValue: totalValue.toFixed(2),
              mostOrderedItem,
              topCustomer,
              avgOrdersPerHour,
              avgTicket,
            },
          ];
        })
      );

      setMetrics(Object.fromEntries(results));
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Não foi possível carregar dados.',
      });
    } finally {
      setIsLoading(false);
    }
  })();
}, []);


  const handleLogoError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/logo.png';
  };

  if (isLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
      </Container>
    );
  }

  return (
    <div className="dashboard-root">
      <NavlogComponent />
      <Container fluid className="dashboard-main ">

        <div className="dashboard-section ">
          <h3 className="dashboard-section-title"></h3>
          <Row className="dashboard-establishments-list gx-3 gy-4 ">
            {establishments.length === 0 && (
              <Col>
                <div className="dashboard-empty">Nenhum estabelecimento encontrado.</div>
              </Col>
            )}
            {establishments.map((est) => {
              const m = metrics[est.id] || {};
              return (
                <Col key={est.id} md={12}  >
                  <Card className="dashboard-establishment-card h-100 ">
                    <Card.Body>
                      <div className="dashboard-establishment-header mb-3">
                        <img
                          src={`${storageUrl}/${est.logo || 'logo.png'}`}
                          alt={est.name}
                          className="dashboard-establishment-logo"
                          onError={handleLogoError}
                        />
                        <div>
                          <div className="dashboard-establishment-name">{est.name}</div>
                          <div className="dashboard-establishment-slug">@{est.slug}</div>
                             <Button
      as={Link}
      to={`/establishment/view/${est.slug}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
     Page
    </Button>
                        </div>
                      </div>
<Card bg="dark" text="light" className="m-2">
 
  <Card.Body className="p-2 text-center">
    <Button
      as={Link}
      to={`/order/create/${est.id}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
      🛒 Novo Pedido
    </Button>
    <Button
      as={Link}
      to={`/order/list/${est.id}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
      📑 Pedidos
    </Button>
    <Button
      as={Link}
      to={`/report/order/${est.id}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
      📊 Relatório
    </Button>
    <Button
      as={Link}
      to={`/item/list/${est.slug}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
      🍔 Itens
    </Button>
    <Button
      as={Link}
      to={`/establishment/update/${est.id}`}
      size="sm"
      className="dashboard-establishment-btn mx-1 bg-black"
    >
      ✏️ Editar
    </Button>
  </Card.Body>
</Card>

                    <Card bg="dark" text="light" className="mb-2">
  <Card.Header className="bg-dark text-light">
    <strong>Retrato de hoje</strong>
  </Card.Header>
  <Card.Body className="p-2">
    <Row className="mb-3 text-center">
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Pedidos Hoje</Card.Title>
            <Card.Text className="fs-5 fw-bold">{m.totalOrders || 0}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Faturamento</Card.Title>
            <Card.Text className="fs-5 fw-bold">
              R${(m.totalValue || '0.00').replace('.', ',')}
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Item Mais Pedido</Card.Title>
            <Card.Text className="fs-6 fw-bold">{m.mostOrderedItem}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Cliente Top</Card.Title>
            <Card.Text className="fs-6 fw-bold">{m.topCustomer}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Média/Hora</Card.Title>
            <Card.Text className="fs-5 fw-bold">{m.avgOrdersPerHour}</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card bg="black" text="light" className="mb-2">
          <Card.Body className="p-2">
            <Card.Title className="fs-6">Ticket Médio</Card.Title>
            <Card.Text className="fs-5 fw-bold">
              R${(m.avgTicket || '0.00').replace('.', ',')}
            </Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </Card.Body>
</Card>


                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </Container>
    </div>
  );
}

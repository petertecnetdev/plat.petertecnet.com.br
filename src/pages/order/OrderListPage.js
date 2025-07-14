// src/pages/order/OrderListPage.js
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";

const OrderListPage = () => {
  const { entityId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${apiBaseUrl}/order/listbyentity`,
          {
            params: {
              app_id: 3,
              entity_name: "establishment",
              entity_id: entityId,
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setOrders(res.data.orders);
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.error || "Não foi possível carregar pedidos.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Carregando pedidos...
      </Container>
    );
  }

  return (
    <>
      <NavlogComponent />

      <Container className="mt-4">
        <Row className="mb-3">
          <Col>
            <h3>Pedidos do Estabelecimento</h3>
          </Col>
          <Col className="text-end">
            <Link to="/dashboard">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </Col>
        </Row>

        {orders.length === 0 ? (
          <p>Nenhum pedido encontrado para esta entidade.</p>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {orders.map((order) => (
              <Col key={order.id}>
                <Card className="h-100 shadow-sm">
                  <Card.Header>
                    Pedido #{order.order_number} —{" "}
                    {new Date(order.order_datetime).toLocaleString()}
                  </Card.Header>
                  <Card.Body>
                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <strong>Cliente:</strong> {order.customer_name}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Origem:</strong> {order.origin}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Consumo:</strong> {order.fulfillment}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Status Pgto:</strong> {order.payment_status}
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <strong>Total:</strong> R$ {parseFloat(order.total_price).toFixed(2)}
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between">
                    <Link to={`/order/create/${entityId}`}>
                      <Button size="sm" variant="success">Novo Pedido</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => Swal.fire({
                        title: `Detalhes Pedido #${order.order_number}`,
                        html: `<pre style="text-align:left; white-space:pre-wrap; font-family:monospace">
${order.items.map(i => {
  let line = `${i.quantity}x ${i.item.name} — R$ ${parseFloat(i.subtotal).toFixed(2)}`;
  const mods = i.modifiers.map(m => (m.type === "addition" ? `+${m.modifier.name}` : `−${m.modifier.name}`));
  if (mods.length) line += `\n  (${mods.join(", ")})`;
  return line;
}).join("\n")}

TOTAL R$ ${parseFloat(order.total_price).toFixed(2)}
                        </pre>`,
                        width: 600
                      })}
                    >
                      Ver Itens
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default OrderListPage;

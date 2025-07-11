import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setEstablishment(data.establishment);
        setItems(data.items);
      } catch (e) {
        Swal.fire({ icon: "error", title: "Erro!", text: e.response?.data?.error || "Falha ao carregar." });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !establishment) {
    return <ProcessingIndicatorComponent messages={["Carregando...", "Aguarde..."]} />;
  }

  return (
    <>
      <NavlogComponent />
      <div className="hero-banner position-relative text-white text-center" style={{
        backgroundImage: `url('${establishment.background ? `${storageUrl}/${establishment.background}` : '/images/background.png'}')`,
        backgroundSize: 'cover', height: '350px'
      }}>
        <div className="overlay" style={{ background: 'rgba(0,0,0,0.5)', position: 'absolute', inset: 0 }} />
        <div className="d-flex flex-column justify-content-center align-items-center h-100 position-relative">
          <img
            src={establishment.logo ? `${storageUrl}/${establishment.logo}` : '/images/logo.png'}
            alt={establishment.name}
            className="rounded-circle mb-3"
            style={{ width: 120, height: 120, objectFit: 'cover', border: '4px solid #fff' }}
          />
          <h1>{establishment.name}</h1>
          {establishment.fantasy && <h5 className="text-light">{establishment.fantasy}</h5>}
        </div>
      </div>

      <Container className="py-5">
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Card>
              <Card.Header as="h5">Informações</Card.Header>
              <ListGroup variant="flush">
                {establishment.address && <ListGroup.Item><strong>Endereço:</strong> {establishment.address}, {establishment.city} <Badge bg="secondary">CEP {establishment.cep}</Badge></ListGroup.Item>}
                {establishment.phone && <ListGroup.Item><strong>Telefone:</strong> <a href={`tel:${establishment.phone}`}>{establishment.phone}</a></ListGroup.Item>}
                {establishment.email && <ListGroup.Item><strong>Email:</strong> <a href={`mailto:${establishment.email}`}>{establishment.email}</a></ListGroup.Item>}
                {establishment.website_url && <ListGroup.Item><strong>Site:</strong> <a href={establishment.website_url} target="_blank" rel="noreferrer">Visitar</a></ListGroup.Item>}
                {establishment.instagram_url && <ListGroup.Item><strong>Instagram:</strong> <a href={establishment.instagram_url} target="_blank" rel="noreferrer">@{establishment.instagram_url.split('/').pop()}</a></ListGroup.Item>}
              </ListGroup>
            </Card>
          </Col>

          <Col md={6} className="mb-3">
            <Card>
              <Card.Header as="h5">Proprietário</Card.Header>
              <Card.Body className="d-flex align-items-center">
                <img
                  src={establishment.user.avatar ? `${storageUrl}/${establishment.user.avatar}` : '/images/user.png'}
                  alt={establishment.user.first_name}
                  className="rounded-circle"
                  style={{ width: 60, height: 60, objectFit: 'cover' }}
                />
                <div className="ms-3">
                  <Link to={`/user/${establishment.user.user_name}`}><h6>{establishment.user.first_name}</h6></Link>
                  <p className="mb-0 text-muted">{establishment.user.email}</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4">
          <Card.Header as="h5">Descrição</Card.Header>
          <Card.Body>
            <p>{establishment.description}</p>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header as="h5">Serviços & Itens</Card.Header>
          <ListGroup variant="flush">
            {items.length > 0 ? items.map(item => (
              <ListGroup.Item key={item.id} className="d-flex justify-content-between">
                <span>{item.name}</span>
                <span>R$ {item.price.toFixed(2)}</span>
              </ListGroup.Item>
            )) : <ListGroup.Item className="text-center">Nenhum item cadastrado.</ListGroup.Item>}
          </ListGroup>
        </Card>

        <div className="text-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>← Voltar</Button>
        </div>
      </Container>
    </>
  );
}

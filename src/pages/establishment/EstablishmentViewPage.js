import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [est, setEst] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setEst(data.establishment);
        setMenu(data.items || []);
      } catch (e) {
        Swal.fire({ icon: "error", title: "Erro!", text: e.response?.data?.error || "Falha ao carregar." });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !est) return <ProcessingIndicatorComponent messages={["Carregando...", "Aguarde..."]} />;

  // Agrupa itens por categoria
  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category || "Outros";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const getItemImage = (item) => {
    if (item.image) return `${storageUrl}/${item.image}`;
    if (est.logo) return `${storageUrl}/${est.logo}`;
    return '/images/menu-placeholder.png';
  };

  return (
    <>
      <NavlogComponent />
      <div className="main-container">
        {/* Banner */}
        <div className="barbershop-card overflow-hidden position-relative mb-4" style={{ height: '300px' }}>
          <div className="card-bg" style={{ backgroundImage: `url('${est.background ? `${storageUrl}/${est.background}` : '/images/background.png'}')`, height: '300px' }} />
          <div className="barbershop-card-body d-flex flex-column justify-content-center align-items-center text-center text-white position-relative" style={{ height: '300px' }}>
            <img src={est.logo ? `${storageUrl}/${est.logo}` : '/images/logo.png'} alt={est.name} className="img-component" />
            <h1>{est.name}</h1>
            {est.fantasy && <h5 className="text-muted">{est.fantasy}</h5>}
          </div>
        </div>

        {/* Cardápio por categorias com faixa */}
        {Object.entries(groupedMenu).map(([category, items]) => (
          <div key={category} className="mb-5">
            <div className="label-name-bg text-center mb-3" style={{ fontSize: '1.25rem' }}>
              {category}
            </div>
            <Row className="items-row">
              {items.map(item => {
                const priceNum = Number(item.price);
                return (
                  <Col key={item.id} xs={6} md={4} lg={3} className="item-col mb-4">
                    <Card className="item-card h-100">
                      <Card.Img
                        variant="top"
                        src={getItemImage(item)}
                        className="img-item-component"
                        onError={e => e.target.src = getItemImage(item)}
                      />
                      <Card.Body className="item-card-body d-flex flex-column justify-content-between">
                        <div>
                          <Card.Title className="item-title mb-2">{item.name}</Card.Title>
                          {item.description && (
                            <Card.Text className="text-muted mb-3">
                              {item.description}
                            </Card.Text>
                          )}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">R$ {isNaN(priceNum) ? item.price : priceNum.toFixed(2)}</span>
                          <Button variant="outline-light" className="add-barber-button">Adicionar</Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        ))}

        <div className="text-center">
          <Button className="action-button" onClick={() => navigate(-1)}>← Voltar</Button>
        </div>
      </div>
    </>
  );
}

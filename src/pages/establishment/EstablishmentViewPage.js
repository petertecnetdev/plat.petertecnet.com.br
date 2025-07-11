import React, { useState, useEffect } from "react";
import { Row, Col, Card, Button, Badge } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import { useParams, useNavigate, Link } from "react-router-dom";
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
        setMenu(data.items);
      } catch (e) {
        Swal.fire({ icon: "error", title: "Erro!", text: e.response?.data?.error || "Falha ao carregar." });
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading || !est) return <ProcessingIndicatorComponent messages={["Carregando...", "Aguarde..."]} />;

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

        {/* Cardápio estilo iFood */}
        <h4 className="section-title mb-4">Cardápio</h4>
        <Row className="items-row">
          {menu.length > 0 ? menu.map(item => {
            const priceNum = Number(item.price);
            return (
              <Col key={item.id} xs={6} md={4} lg={3} className="item-col mb-4">
                <Card className="item-card h-100">
                  <Card.Img
                    variant="top"
                    src={
                      item.image ? `${storageUrl}/${item.image}` : '/images/menu-placeholder.png'
                    }
                    className="img-item-component"
                    onError={(e) => e.target.src = '/images/menu-placeholder.png'}
                  />
                  <Card.Body className="item-card-body d-flex flex-column justify-content-between">
                    <div>
                      <Card.Title className="item-title mb-2">{item.name}</Card.Title>
                      <Card.Text className="text-muted mb-3">
                        {item.description || 'Delicioso e irresistível'}
                      </Card.Text>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold">R$ {isNaN(priceNum) ? item.price : priceNum.toFixed(2)}</span>
                      <Button variant="outline-light" className="add-barber-button">Adicionar</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          }) : <p className="empty-text text-center">Nenhum item cadastrado no cardápio.</p>}
        </Row>

        <div className="text-center">
          <Button className="action-button" onClick={() => navigate(-1)}>← Voltar</Button>
        </div>
      </div>
    </>
  );
}

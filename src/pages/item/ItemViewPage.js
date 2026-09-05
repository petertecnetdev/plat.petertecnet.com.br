// src/pages/item/ItemViewPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Modal,
  Table,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { FaWhatsapp, FaEye } from "react-icons/fa";
import { apiBaseUrl, storageUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import "./ItemViewPage.css";

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [interactions, setInteractions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInteractions, setShowInteractions] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const whatsappLink = useWhatsappLink(establishment);
  const whatsappMessage = `Olá, gostaria de saber mais informações sobre o item "${item?.name || item?.title || "selecionado"}". Você poderia me ajudar?`;

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/item/view/${slug}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setItem(data.item);
        setEstablishment(data.establishment);
        setMetrics(data.metrics);
        setRelatedItems(data.related_items);
        setEmployers(data.employers);
        setInteractions(data.interactions);
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            error.response?.data?.error ||
            "Ocorreu um erro ao buscar o item.",
        });
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [slug, token, navigate]);

  if (loading)
    return (
      <div className="ivp-loading">
        <Spinner animation="border" variant="light" />
      </div>
    );

  if (!item)
    return (
      <Container className="ivp-container text-center mt-5">
        <h5>Item não encontrado</h5>
      </Container>
    );

  return (
    <>
      <NavlogComponent />
      <div className="ivp-root">
        <Container className="ivp-container">
          {/* HEADER */}
          <Row className="mb-4 justify-content-center">
            <Col md={10}>
              <Card className="ivp-card glass">
                <Row>
                  <Col md={5} className="d-flex justify-content-center align-items-center">
                    <div className="ivp-image-wrapper">
                      <img
                        src={`${storageUrl}/${item.image}`}
                        alt={item.name}
                        className="ivp-image"
                      />
                    </div>
                  </Col>
                  <Col md={7}>
                    <h2 className="ivp-title">{item.name}</h2>
                    <Badge bg="info" className="me-2">
                      {item.type}
                    </Badge>
                    {item.category && (
                      <Badge bg="secondary">{item.category}</Badge>
                    )}
                    <p className="ivp-desc mt-3">{item.description}</p>

                    <div className="ivp-price mt-3">
                      <h4>R$ {item.price}</h4>
                      {item.discount > 0 && (
                        <small className="text-success ms-2">
                          (-{item.discount}%)
                        </small>
                      )}
                    </div>

                    <div className="ivp-stock mt-2">
                      <Badge bg={item.stock > 0 ? "success" : "danger"}>
                        {item.stock > 0 ? "Disponível" : "Esgotado"}
                      </Badge>
                    </div>

                    <div className="ivp-meta mt-3">
                      <p>
                        Criado por: <strong>{item.creator_name}</strong> <br />
                        Atualizado por: <strong>{item.updater_name}</strong> <br />
                        Última atualização: {item.last_updated_at}
                      </p>
                    </div>

                    {whatsappLink && (
                      <Button
                        variant="success"
                        className="mt-3"
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FaWhatsapp className="me-2" />
                        Falar no WhatsApp
                      </Button>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* METRICS */}
          {metrics && (
            <Row className="g-3 text-center justify-content-center mb-4">
              <Col md={2}>
                <Card className="ivp-metric glass">
                  <h5>{metrics.total_views}</h5>
                  <p>Visualizações</p>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="ivp-metric glass">
                  <h5>{metrics.unique_users}</h5>
                  <p>Usuários únicos</p>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="ivp-metric glass">
                  <h5>{metrics.appointments}</h5>
                  <p>Agendamentos</p>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="ivp-metric glass clickable" onClick={() => setShowInteractions(true)}>
                  <FaEye className="mb-2" size={22} />
                  <p>Ver detalhes de acessos</p>
                </Card>
              </Col>
            </Row>
          )}

          {/* EMPLOYERS */}
          {employers?.length > 0 && (
            <Row className="mb-4 justify-content-center">
              <Col md={10}>
                <h5 className="ivp-section-title">Profissionais Associados</h5>
                <div className="ivp-employers d-flex flex-wrap gap-3">
                  {employers.map((emp) => (
                    <Card key={emp.id} className="ivp-employer glass">
                      <div className="ivp-employer-avatar">
                        <img
                          src={
                            emp.user?.avatar
                              ? `${storageUrl}/${emp.user.avatar}`
                              : "/default-avatar.png"
                          }
                          alt={emp.user?.name}
                        />
                      </div>
                      <div>
                        <h6>{emp.user?.name}</h6>
                        <small>{emp.role}</small>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>
            </Row>
          )}

          {/* RELATED ITEMS */}
          {relatedItems?.length > 0 && (
            <Row className="mb-5 justify-content-center">
              <Col md={10}>
                <h5 className="ivp-section-title">Outros Itens</h5>
                <div className="ivp-related d-flex flex-wrap gap-3">
                  {relatedItems.map((rel) => (
                    <Card
                      key={rel.id}
                      className="ivp-related-card glass"
                      onClick={() => navigate(`/item/${rel.slug}`)}
                    >
                      <img
                        src={`${storageUrl}/${rel.image}`}
                        alt={rel.name}
                        className="ivp-related-img"
                      />
                      <div className="p-2">
                        <h6>{rel.name}</h6>
                        <p className="text-muted small">R$ {rel.price}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />

      {/* MODAL DE INTERAÇÕES */}
      <Modal
        show={showInteractions}
        onHide={() => setShowInteractions(false)}
        size="lg"
        centered
        className="ivp-modal"
      >
        <Modal.Header closeButton className="glass">
          <Modal.Title>Detalhes de Acessos</Modal.Title>
        </Modal.Header>
        <Modal.Body className="glass">
          {!interactions?.by_user?.length ? (
            <p className="text-center text-muted">Nenhuma interação registrada.</p>
          ) : (
            <Table responsive hover variant="dark" className="ivp-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Visualizações</th>
                  <th>Primeiro Acesso</th>
                  <th>Último Acesso</th>
                  <th>IP</th>
                  <th>Navegador</th>
                </tr>
              </thead>
              <tbody>
                {interactions.by_user.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={
                            u.user_avatar
                              ? `${storageUrl}/${u.user_avatar}`
                              : "/default-avatar.png"
                          }
                          alt={u.user_name}
                          className="ivp-avatar"
                        />
                        <div>
                          <strong>{u.user_name}</strong>
                          <br />
                          <small>{u.user_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.total_views}</td>
                    <td>{new Date(u.first_view).toLocaleString()}</td>
                    <td>{new Date(u.last_view).toLocaleString()}</td>
                    <td>{u.ip}</td>
                    <td className="text-truncate">{u.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer className="glass">
          <Button variant="secondary" onClick={() => setShowInteractions(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

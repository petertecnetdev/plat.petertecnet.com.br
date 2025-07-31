// src/pages/item/ItemListPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Badge,
  Button,
} from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Item.css";

export default function ItemListPage() {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState({});
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const pdfRef = useRef();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEstablishment(data.establishment);
        setMenu(data.items || []);
        const cats = Array.from(
          new Set((data.items || []).map(i => i.category || "Sem categoria"))
        );
        setSelectedCategory(cats[0] || null);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar o menu.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save(`${establishment.name}_menu.pdf`);
    } catch {
      Swal.fire("Erro", "Não foi possível gerar o PDF.", "error");
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Carregando itens...
      </Container>
    );
  }

  const categories = Array.from(
    new Set(menu.map(i => i.category || "Sem categoria"))
  );
  const itemsToShow = selectedCategory
    ? menu.filter(i => (i.category || "Sem categoria") === selectedCategory)
    : menu;

  return (
    <>
      <NavlogComponent />
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>{establishment.name.toUpperCase()}</h3>
          <div>
            <Link to={`/item/create/${establishment.slug}`}>
              <Button variant="success" className="me-2">
                Novo Item
              </Button>
            </Link>
            <Button variant="primary" onClick={handleExportPDF} className="me-2">
              Exportar PDF
            </Button>
            <Link to="/dashboard">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={cat === selectedCategory ? "warning" : "outline-warning"}
              className="me-2 mb-2"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div ref={pdfRef}>
          <Row className="g-4">
            {itemsToShow.map(item => (
              <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  {item.image ? (
                    <Card.Img
                      variant="top"
                      src={`${storageUrl}/${item.image}`}
                      alt={item.name}
                      style={{ objectFit: "cover", height: 180 }}
                    />
                  ) : (
                    <div style={{ height: 180 }} />
                  )}
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{item.name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      {item.brand || item.category || "—"}
                    </Card.Subtitle>
                    <Card.Text className="flex-grow-1">
                      {item.description}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold">
                        R${Number(item.price).toFixed(2).replace(".", ",")}
                      </span>
                      <Badge bg={item.status === 1 ? "success" : "secondary"}>
                        {item.status === 1 ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between">
                    <Link to={`/item/update/${item.id}`}>
                      <Button size="sm" variant="warning">
                        Editar
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        Swal.fire({
                          title: "Confirmar exclusão?",
                          text: `Excluir ${item.name}?`,
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonText: "Sim",
                          cancelButtonText: "Não",
                        }).then(res => {
                          if (res.isConfirmed) {
                            axios
                              .delete(`${apiBaseUrl}/item/${item.id}`, {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(
                                    "token"
                                  )}`,
                                },
                              })
                              .then(() =>
                                setMenu(prev => prev.filter(i => i.id !== item.id))
                              )
                              .catch(() =>
                                Swal.fire(
                                  "Erro",
                                  "Não foi possível excluir item.",
                                  "error"
                                )
                              );
                          }
                        })
                      }
                    >
                      Excluir
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </>
  );
}

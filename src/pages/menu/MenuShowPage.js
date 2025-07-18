import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { apiBaseUrl, storageUrl } from "../../config";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function MenuShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [groupedItems, setGroupedItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${apiBaseUrl}/menu/${id}`);
        setMenu(data.menu);
        const items = data.menu.items || [];
        const grouped = {};
        items.forEach(item => {
          const cat = item.category || "Outros";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        });
        setGroupedItems(grouped);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: error.response?.data?.error || "Falha ao carregar o menu."
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const exportPdf = async () => {
    const element = document.querySelector(".menu-page");
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      imageTimeout: 15000,
      scale: 2
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${menu.name}.pdf`);
  };

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando menu...", "Por favor, aguarde..."]}
        interval={500}
      />
    );
  }

  const coverUrl = menu.cover_image
    ? `${storageUrl}/${menu.cover_image}`
    : "/images/menu-cover-placeholder.png";

  const defaultItemImg = "/images/menu-item-placeholder.png";

  return (
    <>
      <NavlogComponent />
      <div className="menu-page">
        {/* Cabeçalho com imagem de capa */}
        <div className="menu-header position-relative" style={{ height: 300 }}>
          <img
            src={coverUrl}
            alt={menu.name}
            style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
            onError={e => { e.target.src = "/images/menu-cover-placeholder.png"; }}
          />
          <div className="overlay position-absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} />
          <div
            className="header-content text-white text-center position-absolute w-100"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            <h1>{menu.name}</h1>
            {menu.description && <p>{menu.description}</p>}
            <Button variant="success" onClick={exportPdf} className="mt-3">
              Exportar PDF
            </Button>
          </div>
        </div>

        <Container className="py-4">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section mb-5">
              <h2 className="mb-3">{category}</h2>
              <Row xs={1} md={2} lg={3} className="g-4">
                {items.map(item => {
                  const price = Number(item.pivot.price_override ?? item.price);
                  const displayPrice = isNaN(price)
                    ? String(item.pivot.price_override ?? item.price)
                    : price.toFixed(2);
                  const imgSrc = item.image
                    ? `${storageUrl}/${item.image}`
                    : defaultItemImg;
                  return (
                    <Col key={item.id}>
                      <Card className="h-100">
                        <Card.Img
                          variant="top"
                          src={imgSrc}
                          onError={e => (e.target.src = defaultItemImg)}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                        <Card.Body className="d-flex flex-column">
                          <Card.Title>{item.name}</Card.Title>
                          {item.description && <Card.Text>{item.description}</Card.Text>}
                          <div className="mt-auto">
                            <strong>R${displayPrice}</strong>
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
            <Button variant="secondary" onClick={() => navigate(-1)}>
              ← Voltar
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
}

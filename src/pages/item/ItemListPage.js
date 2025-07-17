/* eslint-disable react/prop-types */
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Spinner, Badge, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ItemListPage() {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const pdfRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${apiBaseUrl}/establishment/view/${slug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEstablishment(data.establishment);
        setMenu(data.items || []);
        const cats = Array.from(
          new Set((data.items || []).map((i) => i.category || "Sem categoria"))
        );
        setSelectedCategory(cats[0] || null);
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.error || "Não foi possível carregar o menu.",
          "error"
        );
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
      const width = pdf.internal.pageSize.getWidth();
      const props = pdf.getImageProperties(imgData);
      const height = (props.height * width) / props.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${establishment.name}_menu.pdf`);
    } catch {
      Swal.fire("Erro", "Não foi possível gerar o PDF.", "error");
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Carregando menu...
      </Container>
    );
  }

  const categories = Array.from(
    new Set(menu.map((item) => item.category || "Sem categoria"))
  );
  const itemsToShow = selectedCategory
    ? menu.filter(
        (item) => (item.category || "Sem categoria") === selectedCategory
      )
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
                Novo
              </Button>
            </Link>
            <Button
              variant="primary"
              onClick={handleExportPDF}
              className="me-2"
            >
              Exportar PDF
            </Button>
            <Link to="/dashboard">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </div>
        </div>
        <div className="mb-4">
          {categories.map((cat) => (
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
        <div ref={pdfRef} className="item-grid">
          {itemsToShow.map((item) => (
            <div key={item.id} className="ifood-card">
              {item.image && (
                <div className="ifood-card-img-wrapper">
                  <img src={`${storageUrl}/${item.image}`} alt={item.name} />
                </div>
              )}
              <div className="ifood-card-body">
                <div className="ifood-card-title">{item.name}</div>
                <div className="ifood-card-category">
                  {item.brand || item.category}
                </div>
                <div className="ifood-card-desc">{item.description}</div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="ifood-price-badge">
                    R${Number(item.price).toFixed(2).replace(".", ",")}
                  </div>
                  <Badge bg={item.status === 1 ? "success" : "secondary"}>
                    {item.status === 1 ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="ifood-footer">
                <Link to={`/item/update/${item.id}`}>
                  <Button size="sm" variant="warning" className="ifood-btn">
                    Editar
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="danger"
                  className="ifood-btn"
                  onClick={() =>
                    Swal.fire({
                      title: "Confirmar exclusão?",
                      text: `Excluir ${item.name}?`,
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Sim",
                      cancelButtonText: "Não",
                    }).then((res) => {
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
                            setMenu((prev) =>
                              prev.filter((i) => i.id !== item.id)
                            )
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
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

const ItemListPage = () => {
  const { slug } = useParams();
  const [barbershop, setBarbershop] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  const handleImageError = (e) => {
    e.target.src = "images/logo.png";
  };

  const fetchBarbershopAndItems = async () => {
    setMessages(["Carregando itens da barbearia..."]);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const response = await axios.get(
        `${apiBaseUrl}/barbershop/view/${slug}`,
        { headers }
      );
      setBarbershop(response.data.barbershop);
      setItems(response.data.items);
    } catch (error) {
      const errors = error?.response?.data?.errors;
      if (errors) {
        let errorMessage = "";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMessage += `\n${field}: ${messages.join(" / ")}`;
        });
        Swal.fire({
          title: "Erro",
          text:
            errorMessage.trim() || "Erro ao carregar informações da barbearia.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text:
            error.response?.data?.error ||
            "Erro ao carregar informações da barbearia.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBarbershopAndItems();
  }, [slug]);

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Você tem certeza?",
        text: "Esta ação não pode ser desfeita!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, deletar!",
        cancelButtonText: "Cancelar",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        await axios.delete(`${apiBaseUrl}/item/${id}`, { headers });

        Swal.fire({
          title: "Deletado!",
          text: "O item foi deletado com sucesso.",
          icon: "success",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });

        setItems(items.filter((item) => item.id !== id));
      }
    } catch (error) {
      const errors = error?.response?.data?.errors;
      if (errors) {
        let errorMessage = "";
        Object.entries(errors).forEach(([field, messages]) => {
          errorMessage += `\n${field}: ${messages.join(" / ")}`;
        });
        Swal.fire({
          title: "Erro",
          text: errorMessage.trim() || "Erro ao excluir o item.",
          icon: "error",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error.response?.data?.error || "Erro ao excluir o item.",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    }
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">
        {barbershop ? `Itens de ${barbershop.name}` : "Itens da Barbearia"}
      </p>

      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <Card.Body className="card-body">
                <div className="mb-3 text-center">
                  {barbershop && (
                    <Link
                      to={`/item/create/${barbershop.slug}`}
                      className="link-component"
                    >
                      <Button variant="primary" className="action-button">
                        Cadastrar Novo Item
                      </Button>
                    </Link>
                  )}
                </div>

                {isLoading ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent messages={messages} />
                  </Col>
                ) : (
                  <>
                    {items.length > 0 ? (
                      <Row className="inner-row">
                        {items.map((item) => {
                          const bgImage = item.image
                            ? `${storageUrl}/${item.image}`
                            : "/images/logo.png";
                          return (
                            <Col
                              key={item.id}
                              md={6}
                              className="inner-col m-4"
                            >
                              <Card className="inner-card h-100">
                                <div
                                  className="card-bg"
                                  style={{
                                    backgroundImage: `url('${bgImage}')`,
                                  }}
                                />
                                <Card.Body className="inner-card-body d-flex flex-column justify-content-between">
                                  <div className="text-center">
                                    <Link
                                      to={`/item/view/${item.slug}`}
                                      className="link-component"
                                    >
                                      <img
                                        src={bgImage}
                                        className="img-item-component m-4"
                                        alt={item.name}
                                        onError={handleImageError}
                                      />
                                      <p className="item-title">{item.name}</p>
                                    </Link>
                                  </div>
                                  {/* Exemplo de exibição de informações adicionais do item */}
                                  <div>
                                    <p>
                                      <strong>Preço:</strong> R${item.price}
                                    </p>
                                    <p>
                                      <strong>Tipo:</strong>{" "}
                                      {item.type === "produto"
                                        ? "Produto"
                                        : "Serviço"}
                                    </p>
                                  </div>
                                  <div className="d-flex flex-wrap justify-content-center">
                                    <Link
                                      to={`/item/update/${item.id}`}
                                      className="link-component m-1"
                                    >
                                      <Button
                                        variant="secondary"
                                        className="action-button"
                                      >
                                        Editar
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="danger"
                                      className="action-button m-1"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      Deletar
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    ) : (
                      <Col xs={12} className="empty-section text-center">
                        <p className="empty-text">Nenhum item encontrado.</p>
                      </Col>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ItemListPage;

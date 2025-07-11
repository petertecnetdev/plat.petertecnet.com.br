import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../config";

const ItemCreatePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [barbershopId, setBarbershopId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [itemData, setItemData] = useState({
    image: null,
    name: "",
    type: "",
    price: "",
    status: "",
    stock: "",
    availability_start: "",
    availability_end: "",
    discount: "",
    expiration_date: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    is_featured: false,
    limited_by_user: 0,
    notes: "",
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchBarbershop = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/barbershop/view/${slug}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const barbershop = response.data.barbershop || response.data;
        if (barbershop && barbershop.id) {
          setBarbershopId(barbershop.id);
        } else {
          Swal.fire({
            title: "Erro",
            text: "Barbearia não encontrada.",
            icon: "error",
            confirmButtonText: "OK",
            customClass: {
              popup: "custom-swal",
              title: "custom-swal-title",
              content: "custom-swal-text",
            },
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados da barbearia:", error);
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao buscar os dados da barbearia.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    };

    if (slug) {
      fetchBarbershop();
    }
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageResize = (file, setPreview) => {
    const reader = new FileReader();
    if (!file || !file.type.startsWith("image/")) {
      Swal.fire({
        title: "Formato de imagem inválido",
        text: "Por favor, selecione uma imagem.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return;
    }
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 150;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, 150, 150);
        const resizedDataURL = canvas.toDataURL("image/png");
        setPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    handleImageResize(file, setImagePreview);
    setItemData((prevData) => ({
      ...prevData,
      image: file,
    }));
  };

  const handleImageError = (e) => {
    if (e.target.src.includes("/images/itemdefault.png")) return;
    e.target.src = "/images/itemdefault.png";
  };

  const validateFields = () => {
    const errors = [];
    const price = parseFloat(itemData.price);
    if (isNaN(price) || price < 0) {
      errors.push("O preço deve ser um valor monetário válido.");
    }
    if (itemData.status !== "1" && itemData.status !== "0") {
      errors.push("O status deve ser 'Ativo' ou 'Inativo'.");
    }
    const stock = parseInt(itemData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.push("O estoque deve ser um número inteiro válido. Use o valor zero caso não queria gerenciar o estoque.");
    }
    const discount = parseFloat(itemData.discount);
    if (isNaN(discount) || discount < 0) {
      errors.push("O desconto deve ser um valor monetário válido. Use o valor zero caso não queria ofertar desconto para este item.");
    }
    if (itemData.type !== "product" && itemData.type !== "service") {
      errors.push("O tipo de item deve ser 'Produto' ou 'Serviço'.");
    }

    if (errors.length > 0) {
      Swal.fire({
        title: "Erro de validação",
        text: errors.join("\n"),
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateFields()) return;

    if (!barbershopId) {
      Swal.fire({
        title: "Erro",
        text: "Não foi possível obter o ID da barbearia.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    setIsProcessing(true);
    setMessages(["Aguarde enquanto criamos o item..."]);

    const formData = new FormData();
    if (imagePreview && itemData.image && typeof itemData.image !== "string") {
      try {
        const imageBlob = await fetch(imagePreview).then((res) => res.blob());
        formData.append("image", imageBlob, "item.png");
      } catch (err) {
        console.error("Erro ao converter a imagem:", err);
      }
    }

    Object.keys(itemData).forEach((key) => {
      if (key !== "image") {
        if (key === "is_featured") {
          formData.append(key, itemData[key] ? 1 : 0);
        } else {
          formData.append(key, itemData[key]);
        }
      }
    });

    formData.append("entity_id", barbershopId);
    formData.append("entity_name", "barbershop");
    formData.append("app_id", 1);

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };

      await axios.post(`${apiBaseUrl}/item`, formData, { headers });

      Swal.fire({
        title: "Sucesso!",
        text: "Item criado com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(-1);
        }
      });
    } catch (error) {
      console.error("Erro ao criar item:", error);
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "Os seguintes campos têm erros:\n";
        for (const field in validationErrors) {
          errorMessage += `${field}: ${validationErrors[field].join(", ")}\n`;
        }
        Swal.fire({
          title: "Validação Falhou",
          text: errorMessage,
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
          text: "Ocorreu um erro ao tentar criar o item. Tente novamente mais tarde.",
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
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Novo Item</p>
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <Card.Body className="card-body">
                {isProcessing ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent messages={messages} />
                  </Col>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col xs={12} className="mb-4 text-center">
                        <div>
                          <label
                            htmlFor="imageInput"
                            style={{ cursor: "pointer" }}
                          >
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Preview da Imagem do Item"
                                className="img-component"
                                onError={handleImageError}
                              />
                            ) : (
                              <img
                                src="/images/logo.png"
                                alt="Imagem Padrão"
                                className="img-component"
                                onError={handleImageError}
                              />
                            )}
                          </label>
                          <div className="mt-3">
                            <Button
                              variant="secondary"
                              className="action-button"
                              onClick={() =>
                                document.getElementById("imageInput").click()
                              }
                            >
                              Adicionar imagem do item (opcional)
                            </Button>
                          </div>
                          <Form.Control
                            id="imageInput"
                            type="file"
                            accept="image/*"
                            onChange={handleItemImageChange}
                            style={{ display: "none" }}
                          />
                        </div>
                      </Col>

                      {/* Nome */}
                      <Col md={4} className="">
                        <Form.Group controlId="name">
                          <Form.Label>Nome</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={itemData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Preço */}
                      <Col md={2} className="">
                        <Form.Group controlId="price">
                          <Form.Label>Preço</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="price"
                            value={itemData.price}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>

                      {/* Tipo */}
                      <Col md={2} className="">
                        <Form.Group controlId="type">
                          <Form.Label>Tipo</Form.Label>
                          <Form.Control
                            as="select"
                            name="type"
                            value={itemData.type}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="Produto">Produto</option>
                            <option value="Serviço">Serviço</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      {/* Status */}
                      <Col md={2} className="">
                        <Form.Group controlId="status">
                          <Form.Label>Status</Form.Label>
                          <Form.Control
                            as="select"
                            name="status"
                            value={itemData.status}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="1">Ativo</option>
                            <option value="0">Inativo</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      {/* Estoque */}
                      <Col md={2} className="">
                        <Form.Group controlId="stock">
                          <Form.Label>Estoque</Form.Label>
                          <Form.Control
                            type="number"
                            name="stock"
                            value={itemData.stock}
                            onChange={handleInputChange}
                            
                          />
                        </Form.Group>
                      </Col>

                      {/* Desconto */}
                      <Col md={2} className="">
                        <Form.Group controlId="discount">
                          <Form.Label>Desconto</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="discount"
                            value={itemData.discount}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      {/* Data de Início */}
                      <Col md={3} className="">
                        <Form.Group controlId="availability_start">
                          <Form.Label>Data de Início</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="availability_start"
                            value={itemData.availability_start}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      {/* Data de Término */}
                      <Col md={3} className="">
                        <Form.Group controlId="availability_end">
                          <Form.Label>Data de Término</Form.Label>
                          <Form.Control
                            type="datetime-local"
                            name="availability_end"
                            value={itemData.availability_end}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      {/* Descrição */}
                      <Col md={12} className="">
                        <Form.Group controlId="description">
                          <Form.Label>Descrição</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={itemData.description}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>

                      {/* Notas */}
                      <Col md={12} className="">
                        <Form.Group controlId="notes">
                          <Form.Label>Notas</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={itemData.notes || ""}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center">
                      <Button variant="primary" type="submit" className="action-button">
                        {isProcessing ? "Criando..." : "Criar Item"}
                      </Button>
                    </div>

                    {messages.length > 0 && (
                      <div className="mt-3">
                        {messages.map((message, index) => (
                          <div key={index}>{message}</div>
                        ))}
                      </div>
                    )}
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ItemCreatePage;

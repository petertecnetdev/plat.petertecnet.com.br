// ItemUpdatePage.jsx
import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

const ItemUpdatePage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [originalData, setOriginalData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [itemData, setItemData] = useState({
    image: null,
    name: "",
    type: "",
    price: "",
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

  useEffect(() => {
    const fetchItemData = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = response.data;
        setOriginalData(data);
        setItemData({
          image: data.image || null,
          name: data.name || "",
          type: data.type || "",
          price: data.price || "",
          stock: data.stock || "",
          availability_start: data.availability_start || "",
          availability_end: data.availability_end || "",
          discount: data.discount || "",
          expiration_date: data.expiration_date || "",
          description: data.description || "",
          category: data.category || "",
          subcategory: data.subcategory || "",
          brand: data.brand || "",
          is_featured: data.is_featured || false,
          limited_by_user: data.limited_by_user || 0,
          notes: data.notes || "",
        });
        if (data.image) {
          setImagePreview(`${storageUrl}/${data.image}`);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do item:", error);
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao buscar os dados do item.",
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
    fetchItemData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItemData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageError = (e) => {
    if (e.target.src.includes("/images/itemdefault.png")) return;
    e.target.src = "/images/itemdefault.png";
  };

  const handleImageResize = (file, setPreview, width, height) => {
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
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataURL = canvas.toDataURL("image/png");
        setPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    handleImageResize(file, setImagePreview, 150, 150);
    setItemData((prevData) => ({
      ...prevData,
      image: file,
    }));
  };

  // Validação básica antes do envio
  const validateFields = () => {
    const errors = [];
    const price = parseFloat(itemData.price);
    if (isNaN(price) || price < 0) {
      errors.push("O preço deve ser um valor monetário válido.");
    }
    const stock = parseInt(itemData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.push("O estoque deve ser um número inteiro válido.");
    }
    const discount = parseFloat(itemData.discount);
    if (isNaN(discount) || discount < 0) {
      errors.push("O desconto deve ser um valor monetário válido.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setIsProcessing(true);
    setMessages(["Aguarde enquanto atualizamos o item..."]);

    const formData = new FormData();
    // Se houver nova imagem, converte e adiciona
    if (imagePreview && itemData.image && typeof itemData.image !== "string") {
      try {
        const imageBlob = await fetch(imagePreview).then((res) => res.blob());
        formData.append("image", imageBlob, "item.png");
      } catch (err) {
        console.error("Erro ao converter a imagem:", err);
      }
    }
    // Adiciona apenas campos que foram alterados
    Object.keys(itemData).forEach((key) => {
      if (key !== "image" && itemData[key] !== originalData[key]) {
        if (key === "is_featured") {
          formData.append(key, itemData[key] ? 1 : 0);
        } else {
          formData.append(key, itemData[key]);
        }
      }
    });

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };
      await axios.post(`${apiBaseUrl}/item/${id}`, formData, { headers });

      Swal.fire({
        title: "Sucesso!",
        text: "Item atualizado com sucesso!",
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
      console.error("Erro ao atualizar item:", error);
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
          text: "Ocorreu um erro ao tentar atualizar o item. Tente novamente mais tarde.",
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
      <p className="section-title text-center">Atualizar Item</p>

      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            {isProcessing ? (
              <div className="loading-section">
                <ProcessingIndicatorComponent messages={messages} />
              </div>
            ) : (
              <Card className="card-component shadow-sm">
                <Card.Body className="card-body">
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
                                alt="Preview da Imagem"
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
                              Adicionar imagem
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

                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formName" className="form-group">
                          <Form.Label>Nome</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={itemData.name || ""}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group controlId="formType" className="form-group">
                          <Form.Label>Tipo</Form.Label>
                          <Form.Control
                            as="select"
                            name="type"
                            value={itemData.type || ""}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                          >
                            <option value="">Selecione</option>
                            <option value="product">Produto</option>
                            <option value="service">Serviço</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group controlId="formPrice" className="form-group">
                          <Form.Label>Preço</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="price"
                            value={itemData.price || ""}
                            onChange={handleInputChange}
                            required
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group controlId="formStock" className="form-group">
                          <Form.Label>Estoque</Form.Label>
                          <Form.Control
                            type="number"
                            name="stock"
                            value={itemData.stock || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formDiscount"
                          className="form-group"
                        >
                          <Form.Label>Desconto</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            name="discount"
                            value={itemData.discount || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formAvailabilityStart"
                          className="form-group"
                        >
                          <Form.Label>Início</Form.Label>
                          <Form.Control
                            type="date"
                            name="availability_start"
                            value={itemData.availability_start || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formAvailabilityEnd"
                          className="form-group"
                        >
                          <Form.Label>Término</Form.Label>
                          <Form.Control
                            type="date"
                            name="availability_end"
                            value={itemData.availability_end || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formExpirationDate"
                          className="form-group"
                        >
                          <Form.Label>Expiração</Form.Label>
                          <Form.Control
                            type="date"
                            name="expiration_date"
                            value={itemData.expiration_date || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formCategory"
                          className="form-group"
                        >
                          <Form.Label>Categoria</Form.Label>
                          <Form.Control
                            type="text"
                            name="category"
                            value={itemData.category || ""}
                            onChange={handleInputChange}
                            
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group
                          controlId="formSubcategory"
                          className="form-group"
                        >
                          <Form.Label>Subcategoria</Form.Label>
                          <Form.Control
                            type="text"
                            name="subcategory"
                            value={itemData.subcategory || ""}
                            onChange={handleInputChange}
                            
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={2} className="mb-3">
                        <Form.Group controlId="formBrand" className="form-group">
                          <Form.Label>Marca</Form.Label>
                          <Form.Control
                            type="text"
                            name="brand"
                            value={itemData.brand || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12} className="mb-3">
                        <Form.Group
                          controlId="formDescription"
                          className="form-group"
                        >
                          <Form.Label>Descrição</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={itemData.description || ""}
                            onChange={handleInputChange}
                            
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={12} className="mb-3">
                        <Form.Group controlId="formNotes" className="form-group">
                          <Form.Label>Notas</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="notes"
                            value={itemData.notes || ""}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center">
                      <Button
                        variant="primary"
                        type="submit"
                        className="action-button"
                      >
                        Atualizar Item
                      </Button>
                    </div>

                    {/* Mensagens de processamento, se existirem */}
                    {messages.length > 0 && (
                      <div className="mt-3">
                        {messages.map((message, index) => (
                          <div key={index}>{message}</div>
                        ))}
                      </div>
                    )}
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ItemUpdatePage;

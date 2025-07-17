import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, storageUrl } from "../../config";

export default function ItemUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    price: "",
    stock: "",
    status: "1",
    limited_by_user: "0",
    category: "",
    subcategory: "",
    brand: "",
    availability_start: "",
    availability_end: "",
    tags: "",
    discount: "",
    expiration_date: "",
    notes: "",
    is_featured: "0",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const item = res.data;
        setForm({
          name: item.name || "",
          type: item.type || "",
          description: item.description || "",
          price: String(item.price || ""),
          stock: String(item.stock || ""),
          status: String(item.status || 0),
          limited_by_user: String(item.limited_by_user || 0),
          category: item.category || "",
          subcategory: item.subcategory || "",
          brand: item.brand || "",
          availability_start: item.availability_start?.slice(0, 16) || "",
          availability_end: item.availability_end?.slice(0, 16) || "",
          tags: item.tags || "",
          discount: String(item.discount || ""),
          expiration_date: item.expiration_date?.slice(0, 10) || "",
          notes: item.notes || "",
          is_featured: String(item.is_featured || 0),
        });
        if (item.image) {
          setImagePreview(`${storageUrl}/${item.image}`);
        }
      } catch (err) {
        Swal.fire(
          "Erro",
          err.response?.data?.error || "Não foi possível carregar o item.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const W = 150,
          H = 150;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, W, H);
        setImagePreview(canvas.toDataURL("image/png"));
      };
    };
    reader.readAsDataURL(file);
  }

  function handleImageError(e) {
    e.target.src = "/images/default_item.png";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (imagePreview && imagePreview.startsWith("data:")) {
        const blob = await fetch(imagePreview).then((res) => res.blob());
        formData.append("image", blob, "image.png");
      }
      await axios.post(`${apiBaseUrl}/item/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Sucesso", "Item atualizado com sucesso.", "success");
      navigate("/");
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível atualizar o item.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Spinner animation="border" className="mt-5 d-block mx-auto" />;
  }

  return (
    <>
      <NavlogComponent />
      <Container className="mt-4">
        <Row className="mb-3 align-items-center">
          <Col>
            <h3>Editar Item</h3>
          </Col>
          <Col className="text-end">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </Col>
        </Row>
        <Form onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12} className="text-center mb-4">
              <label htmlFor="imageInput" style={{ cursor: "pointer" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview do Item"
                    className="img-fluid img-thumbnail"
                    onError={handleImageError}
                    width={150}
                    height={150}
                  />
                ) : (
                  <div className="border p-5">Clique para adicionar imagem</div>
                )}
              </label>
              <div className="mt-2">
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  Selecionar imagem
                </Button>
              </div>
              <Form.Control
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </Col>
            {/* Campos de formulário */}
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="type">
                <Form.Label>Tipo</Form.Label>
                <Form.Control
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="description">
                <Form.Label>Descrição</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="category">
                <Form.Label>Categoria</Form.Label>
                <Form.Control
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="subcategory">
                <Form.Label>Subcategoria</Form.Label>
                <Form.Control
                  value={form.subcategory}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subcategory: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="brand">
                <Form.Label>Marca</Form.Label>
                <Form.Control
                  value={form.brand}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brand: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="price">
                <Form.Label>Preço (R$)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="stock">
                <Form.Label>Estoque</Form.Label>
                <Form.Control
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stock: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="limited_by_user">
                <Form.Label>Limitado por usuário</Form.Label>
                <Form.Select
                  value={form.limited_by_user}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, limited_by_user: e.target.value }))
                  }
                >
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="availability_start">
                <Form.Label>Disponível de</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={form.availability_start}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      availability_start: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="availability_end">
                <Form.Label>até</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={form.availability_end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availability_end: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="expiration_date">
                <Form.Label>Expira em</Form.Label>
                <Form.Control
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiration_date: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="tags">
                <Form.Label>Tags (vírgula)</Form.Label>
                <Form.Control
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="discount">
                <Form.Label>Desconto (R$)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discount: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="is_featured">
                <Form.Label>Destaque</Form.Label>
                <Form.Select
                  value={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.value }))
                  }
                >
                  <option value="0">Não</option>
                  <option value="1">Sim</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="notes">
                <Form.Label>Notas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Button type="submit" className="mt-4" disabled={submitting}>
            {submitting ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </Form>
      </Container>
    </>
  );
}

// src/pages/item/ItemCreatePage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl } from "../../config";
import "./Item.css";

export default function ItemCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [files, setFiles] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${slug}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEstablishment(res.data.establishment);
      } catch {
        Swal.fire("Erro", "Não foi possível carregar o estabelecimento.", "error");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate]);

  const handleResizeImage = (file, setPreview, width, height, key) => {
    return new Promise((resolve, reject) => {
      if (!file?.type.startsWith("image/")) {
        Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
        return reject();
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const previewDataURL = canvas.toDataURL("image/png");
          setPreview(previewDataURL);
          canvas.toBlob(blob => {
            const filename = file.name.replace(/\.[^/.]+$/, "") + ".png";
            const resizedFile = new File([blob], filename, { type: "image/png" });
            setFiles(prev => ({ ...prev, [key]: resizedFile }));
            resolve(resizedFile);
          }, "image/png", 0.95);
        };
        img.onerror = () => reject();
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async e => {
    const file = e.target.files[0];
    await handleResizeImage(file, setImagePreview, 250, 250, "image");
  };

  const onSubmit = async data => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Erro", "Você precisa estar autenticado.", "error");
      return;
    }
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value || "");
    });
    formData.append("entity_id", establishment.id);
    formData.append("entity_name", "establishment");
    formData.append("app_id", "3");
    if (files.image) {
      formData.append("image", files.image);
    }
    try {
      await axios.post(`${apiBaseUrl}/item`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      Swal.fire("Sucesso", "Item cadastrado com sucesso.", "success");
      navigate(-1);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível criar o item.", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <Spinner animation="border" variant="warning" />
      </div>
    );
  }

  return (
    <>
      <NavlogComponent />
      <Container className="mt-4">
        <Row className="mb-3 align-items-center">
          <Col><h3>Criar Item</h3></Col>
          <Col className="text-end">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Voltar
            </Button>
          </Col>
        </Row>
        <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row className="g-3">
            <Col xs={12} className="text-center mb-4">
              <label htmlFor="imageInput" style={{ cursor: "pointer" }}>
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="img-fluid img-thumbnail"
                    width={150}
                    height={150}
                  />
                ) : (
                  <div className="border p-5">Clique para adicionar imagem</div>
                )}
              </label>
              <div className="mt-2">
                <Button variant="secondary" onClick={() => document.getElementById("imageInput").click()}>
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
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>Nome*</Form.Label>
                <Form.Control
                  {...register("name", { required: true })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="type">
                <Form.Label>Tipo*</Form.Label>
                <Form.Control
                  {...register("type", { required: true })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="description">
                <Form.Label>Descrição</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  {...register("description")}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="category">
                <Form.Label>Categoria</Form.Label>
                <Form.Control {...register("category")} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="subcategory">
                <Form.Label>Subcategoria</Form.Label>
                <Form.Control {...register("subcategory")} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="brand">
                <Form.Label>Marca</Form.Label>
                <Form.Control {...register("brand")} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="price">
                <Form.Label>Preço (R$)*</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  {...register("price", { required: true })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="stock">
                <Form.Label>Estoque*</Form.Label>
                <Form.Control
                  type="number"
                  {...register("stock", { required: true })}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select {...register("status")}>
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="limited_by_user">
                <Form.Label>Limitado por usuário</Form.Label>
                <Form.Select {...register("limited_by_user")}>
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
                  {...register("availability_start")}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="availability_end">
                <Form.Label>até</Form.Label>
                <Form.Control
                  type="datetime-local"
                  {...register("availability_end")}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="expiration_date">
                <Form.Label>Expira em</Form.Label>
                <Form.Control
                  type="date"
                  {...register("expiration_date")}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="discount">
                <Form.Label>Desconto (%)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  {...register("discount")}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="is_featured">
                <Form.Label>Destaque</Form.Label>
                <Form.Select {...register("is_featured")}>
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
                  {...register("notes")}
                />
              </Form.Group>
            </Col>
            <Col xs={12} className="text-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner animation="border" size="sm" /> : "Criar Item"}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

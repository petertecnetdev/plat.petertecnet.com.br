import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, appId } from "../../config";
import "./Item.css";

const apiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.response?.data?.errors
    ? Object.values(error.response.data.errors).flat().join("\n")
    : "") ||
  fallback;

export default function ItemCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { status: "1", limited_by_user: "0", is_featured: "0", stock: 0 },
  });
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${apiBaseUrl}/establishment/view/${encodeURIComponent(slug)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const est = res.data?.establishment || res.data;
        if (!est?.id) throw new Error("Estabelecimento não encontrado.");
        if (Number(est.app_id) !== Number(appId)) {
          throw new Error("Este estabelecimento não pertence à Plat.");
        }
        if (mounted) setEstablishment(est);
      } catch (error) {
        await Swal.fire("Erro", apiMessage(error, "Não foi possível carregar o estabelecimento."), "error");
        navigate("/establishment", { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug, navigate]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      Swal.fire("Imagem muito grande", "Use uma imagem com até 8 MB.", "warning");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    const token = localStorage.getItem("token");
    if (!token || !establishment?.id) {
      Swal.fire("Erro", "Sessão ou estabelecimento inválido.", "error");
      return;
    }

    const formData = new FormData();
    const normalized = {
      ...data,
      name: String(data.name || "").trim(),
      type: String(data.type || "").trim(),
      price: data.price === "" ? 0 : data.price,
      stock: data.stock === "" ? 0 : data.stock,
      status: data.status === "1" ? "1" : "0",
      limited_by_user: data.limited_by_user === "1" ? "1" : "0",
      is_featured: data.is_featured === "1" ? "1" : "0",
    };

    Object.entries(normalized).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    });
    formData.append("entity_id", String(establishment.id));
    formData.append("entity_name", "establishment");
    formData.append("app_id", String(appId));
    if (imageFile) formData.append("image", imageFile);

    try {
      await axios.post(`${apiBaseUrl}/item`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      await Swal.fire("Sucesso", "Item cadastrado com sucesso.", "success");
      navigate(`/item/list/${establishment.slug}`);
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível criar o item."), error?.response?.status === 422 ? "warning" : "error");
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" variant="warning" /></div>;
  }

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <Row className="mb-3 align-items-center">
          <Col>
            <span className="text-muted">{establishment?.name}</span>
            <h1 className="page-header mb-0">Novo item</h1>
          </Col>
          <Col className="text-end">
            <Button variant="secondary" onClick={() => navigate(`/item/list/${establishment.slug}`)}>Voltar</Button>
          </Col>
        </Row>

        <Form className="card-container" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row className="g-3">
            <Col xs={12} className="text-center mb-3">
              <label htmlFor="imageInput" style={{ cursor: "pointer" }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 18 }} />
                ) : (
                  <div className="border rounded p-5 text-muted">Clique para adicionar imagem</div>
                )}
              </label>
              <Form.Control id="imageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </Col>

            <Col md={6}><Form.Group><Form.Label>Nome*</Form.Label><Form.Control {...register("name", { required: true })} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Tipo*</Form.Label><Form.Select {...register("type", { required: true })}><option value="">Selecione</option><option value="product">Produto</option><option value="service">Serviço</option></Form.Select></Form.Group></Col>
            <Col xs={12}><Form.Group><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} {...register("description")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Categoria</Form.Label><Form.Control {...register("category")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Subcategoria</Form.Label><Form.Control {...register("subcategory")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Marca</Form.Label><Form.Control {...register("brand")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Preço (R$)*</Form.Label><Form.Control type="number" min="0" step="0.01" {...register("price", { required: true })} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Estoque</Form.Label><Form.Control type="number" min="0" {...register("stock")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Status</Form.Label><Form.Select {...register("status")}><option value="1">Ativo</option><option value="0">Inativo</option></Form.Select></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Destaque</Form.Label><Form.Select {...register("is_featured")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Disponível de</Form.Label><Form.Control type="datetime-local" {...register("availability_start")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Até</Form.Label><Form.Control type="datetime-local" {...register("availability_end")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Expira em</Form.Label><Form.Control type="date" {...register("expiration_date")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Desconto</Form.Label><Form.Control type="number" min="0" step="0.01" {...register("discount")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Limitado por usuário</Form.Label><Form.Select {...register("limited_by_user")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col xs={12}><Form.Group><Form.Label>Notas</Form.Label><Form.Control as="textarea" rows={2} {...register("notes")} /></Form.Group></Col>
            <Col xs={12} className="text-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner animation="border" size="sm" /> : "Criar item"}</Button></Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

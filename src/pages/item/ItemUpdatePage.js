import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, appId, storageUrl } from "../../config";
import "./Item.css";

const emptyForm = {
  name: "", type: "", description: "", price: "", stock: "0", status: "1",
  limited_by_user: "0", category: "", subcategory: "", brand: "",
  availability_start: "", availability_end: "", tags: "", discount: "",
  expiration_date: "", notes: "", is_featured: "0",
};

const apiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") || fallback;

const firstImage = (item) => {
  const file = Array.isArray(item?.files) ? item.files.find((entry) => entry?.path) : null;
  if (file?.path) return `${storageUrl}/${file.path}`;
  if (item?.image) return `${storageUrl}/${item.image}`;
  return null;
};

export default function ItemUpdatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [item, setItem] = useState(null);
  const [establishment, setEstablishment] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${apiBaseUrl}/item/view/${id}`, {
          params: { app_id: appId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const loaded = data?.item || data;
        const est = data?.establishment || null;
        if (!loaded?.id || Number(loaded.app_id) !== Number(appId)) {
          throw new Error("Item inválido para a Plat.");
        }
        if (!mounted) return;
        setItem(loaded);
        setEstablishment(est);
        setImagePreview(firstImage(loaded));
        setForm({
          name: loaded.name || "",
          type: loaded.type || "",
          description: loaded.description || "",
          price: loaded.price ?? "",
          stock: loaded.stock ?? "0",
          status: loaded.status ? "1" : "0",
          limited_by_user: loaded.limited_by_user ? "1" : "0",
          category: loaded.category || "",
          subcategory: loaded.subcategory || "",
          brand: loaded.brand || "",
          availability_start: loaded.availability_start?.slice(0, 16) || "",
          availability_end: loaded.availability_end?.slice(0, 16) || "",
          tags: Array.isArray(loaded.tags) ? loaded.tags.join(", ") : (loaded.tags || ""),
          discount: loaded.discount ?? "",
          expiration_date: loaded.expiration_date?.slice(0, 10) || "",
          notes: loaded.notes || "",
          is_featured: loaded.is_featured ? "1" : "0",
        });
      } catch (error) {
        await Swal.fire("Erro", apiMessage(error, "Não foi possível carregar o item."), "error");
        navigate(-1);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate]);

  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      Swal.fire("Imagem inválida", "Selecione uma imagem de até 8 MB.", "warning");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!item?.id) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = new FormData();
      const plainFields = [
        "name", "type", "description", "price", "stock", "status", "limited_by_user",
        "category", "subcategory", "brand", "availability_start", "availability_end",
        "discount", "expiration_date", "notes", "is_featured",
      ];
      plainFields.forEach((field) => {
        const value = form[field];
        if (value !== "" && value !== null && value !== undefined) payload.append(field, value);
      });
      String(form.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean)
        .forEach((tag) => payload.append("tags[]", tag));
      if (imageFile) payload.append("image", imageFile);

      await axios.post(`${apiBaseUrl}/item/${item.id}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      await Swal.fire("Sucesso", "Item atualizado com sucesso.", "success");
      if (establishment?.slug) navigate(`/item/list/${establishment.slug}`);
      else navigate(-1);
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível atualizar o item."), error?.response?.status === 422 ? "warning" : "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner animation="border" className="mt-5 d-block mx-auto" />;

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div><span className="text-muted">{establishment?.name || "Plat"}</span><h1 className="page-header mb-0">Editar item</h1></div>
          <Button variant="secondary" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
        <Form className="card-container" onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col xs={12} className="text-center mb-3">
              <label htmlFor="itemImage" style={{ cursor: "pointer" }}>
                {imagePreview ? <img src={imagePreview} alt="Item" style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 18 }} onError={(e) => { e.currentTarget.src = "/images/itemimage.png"; }} /> : <div className="border rounded p-5 text-muted">Adicionar imagem</div>}
              </label>
              <Form.Control id="itemImage" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
            </Col>
            <Col md={6}><Form.Label>Nome</Form.Label><Form.Control required value={form.name} onChange={change("name")} /></Col>
            <Col md={6}><Form.Label>Tipo</Form.Label><Form.Select required value={form.type} onChange={change("type")}><option value="product">Produto</option><option value="service">Serviço</option></Form.Select></Col>
            <Col xs={12}><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={change("description")} /></Col>
            <Col md={4}><Form.Label>Categoria</Form.Label><Form.Control value={form.category} onChange={change("category")} /></Col>
            <Col md={4}><Form.Label>Subcategoria</Form.Label><Form.Control value={form.subcategory} onChange={change("subcategory")} /></Col>
            <Col md={4}><Form.Label>Marca</Form.Label><Form.Control value={form.brand} onChange={change("brand")} /></Col>
            <Col md={3}><Form.Label>Preço</Form.Label><Form.Control type="number" min="0" step="0.01" required value={form.price} onChange={change("price")} /></Col>
            <Col md={3}><Form.Label>Estoque</Form.Label><Form.Control type="number" min="0" value={form.stock} onChange={change("stock")} /></Col>
            <Col md={3}><Form.Label>Status</Form.Label><Form.Select value={form.status} onChange={change("status")}><option value="1">Ativo</option><option value="0">Inativo</option></Form.Select></Col>
            <Col md={3}><Form.Label>Destaque</Form.Label><Form.Select value={form.is_featured} onChange={change("is_featured")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Col>
            <Col md={4}><Form.Label>Disponível de</Form.Label><Form.Control type="datetime-local" value={form.availability_start} onChange={change("availability_start")} /></Col>
            <Col md={4}><Form.Label>Até</Form.Label><Form.Control type="datetime-local" value={form.availability_end} onChange={change("availability_end")} /></Col>
            <Col md={4}><Form.Label>Expira em</Form.Label><Form.Control type="date" value={form.expiration_date} onChange={change("expiration_date")} /></Col>
            <Col md={6}><Form.Label>Tags</Form.Label><Form.Control value={form.tags} onChange={change("tags")} placeholder="hambúrguer, promoção, vegetariano" /></Col>
            <Col md={3}><Form.Label>Desconto</Form.Label><Form.Control type="number" min="0" step="0.01" value={form.discount} onChange={change("discount")} /></Col>
            <Col md={3}><Form.Label>Limitado por usuário</Form.Label><Form.Select value={form.limited_by_user} onChange={change("limited_by_user")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Col>
            <Col xs={12}><Form.Label>Notas</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={change("notes")} /></Col>
            <Col xs={12} className="text-end"><Button type="submit" disabled={submitting}>{submitting ? <Spinner size="sm" /> : "Salvar alterações"}</Button></Col>
          </Row>
        </Form>
      </Container>
    </>
  );
}

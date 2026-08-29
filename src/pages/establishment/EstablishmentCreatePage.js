import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Col, Form, Row } from "react-bootstrap";
import { apiBaseUrl, appId } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import "./Establishment.css";

const categoryOptions = [
  ["restaurante", "Restaurante"], ["hamburgueria", "Hamburgueria"],
  ["sorveteria", "Sorveteria"], ["fast_food", "Fast Food"],
  ["doceria", "Doceria"], ["cafeteria", "Cafeteria"],
  ["pizzaria", "Pizzaria"], ["pub", "Pub"],
];
const segmentOptions = [
  ["delivery", "Delivery"], ["retirada", "Retirada no local"],
  ["presencial", "Consumo no local"], ["balcao", "Balcão"],
  ["eventos", "Eventos"], ["catering", "Catering"],
];

const apiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") || fallback;

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [logo, setLogo] = useState(null);
  const [background, setBackground] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [segments, setSegments] = useState([]);

  const selectImage = (setter, previewSetter, maxMb) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > maxMb * 1024 * 1024) {
      Swal.fire("Imagem inválida", `Selecione uma imagem válida de até ${maxMb} MB.`, "warning");
      return;
    }
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const toggleSegment = (value) => {
    setSegments((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const onSubmit = async (data) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Erro", "Sua sessão expirou. Entre novamente.", "error");
      return;
    }

    const payload = new FormData();
    payload.append("app_id", String(appId));
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        payload.append(key, String(value).trim());
      }
    });
    segments.forEach((segment) => payload.append("segments[]", segment));
    if (logo) payload.append("logo", logo);
    if (background) payload.append("background", background);

    try {
      const { data: response } = await axios.post(`${apiBaseUrl}/establishment`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      await Swal.fire("Sucesso", response.message || "Estabelecimento criado com sucesso.", "success");
      navigate("/establishment");
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível criar o estabelecimento."), error?.response?.status === 422 ? "warning" : "error");
    }
  };

  return (
    <div className="establishment-root establishment-root--app">
      <NavlogComponent />
      <main className="establishment-create-page">
        <header className="establishment-page-header">
          <div><span className="establishment-eyebrow">Configuração</span><h1>Novo estabelecimento</h1><p>Cadastre a operação que será gerenciada pela Plat.</p></div>
          <Button variant="secondary" onClick={() => navigate("/establishment")}>Cancelar</Button>
        </header>

        <Form className="card-container" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row className="g-4">
            <Col xs={12}>
              <div className="image-preview-container">
                {backgroundPreview ? <img src={backgroundPreview} alt="Capa" className="background-preview" /> : <div className="background-preview d-flex align-items-center justify-content-center text-muted">Capa do estabelecimento</div>}
                {logoPreview ? <img src={logoPreview} alt="Logo" className="logo-preview" /> : <img src="/images/logo.png" alt="Plat" className="logo-preview" />}
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                <Button type="button" variant="secondary" onClick={() => document.getElementById("estBackground").click()}>Selecionar capa</Button>
                <Button type="button" variant="secondary" onClick={() => document.getElementById("estLogo").click()}>Selecionar logo</Button>
              </div>
              <Form.Control id="estBackground" type="file" accept="image/*" onChange={selectImage(setBackground, setBackgroundPreview, 8)} style={{ display: "none" }} />
              <Form.Control id="estLogo" type="file" accept="image/*" onChange={selectImage(setLogo, setLogoPreview, 4)} style={{ display: "none" }} />
            </Col>

            <Col md={6}><Form.Label>Nome *</Form.Label><Form.Control required {...register("name", { required: true })} /></Col>
            <Col md={6}><Form.Label>Nome fantasia</Form.Label><Form.Control {...register("fantasy")} /></Col>
            <Col md={4}><Form.Label>Categoria *</Form.Label><Form.Select required {...register("category", { required: true })}><option value="">Selecione</option>{categoryOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Form.Select></Col>
            <Col md={4}><Form.Label>Tipo</Form.Label><Form.Control {...register("type")} placeholder="Ex.: restaurante, dark kitchen" /></Col>
            <Col md={4}><Form.Label>CNPJ</Form.Label><Form.Control {...register("cnpj")} /></Col>
            <Col md={6}><Form.Label>Telefone</Form.Label><Form.Control {...register("phone")} /></Col>
            <Col md={6}><Form.Label>E-mail</Form.Label><Form.Control type="email" {...register("email")} /></Col>
            <Col xs={12}><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} {...register("description")} /></Col>
            <Col md={6}><Form.Label>Endereço</Form.Label><Form.Control {...register("address")} /></Col>
            <Col md={3}><Form.Label>Cidade</Form.Label><Form.Control {...register("city")} /></Col>
            <Col md={1}><Form.Label>UF</Form.Label><Form.Control maxLength={2} {...register("uf")} /></Col>
            <Col md={2}><Form.Label>CEP</Form.Label><Form.Control {...register("cep")} /></Col>
            <Col xs={12}><Form.Label>Localização / Google Maps</Form.Label><Form.Control {...register("location")} /></Col>
            <Col md={6}><Form.Label>Instagram</Form.Label><Form.Control type="url" {...register("instagram_url")} /></Col>
            <Col md={6}><Form.Label>Site</Form.Label><Form.Control type="url" {...register("website_url")} /></Col>

            <Col xs={12}>
              <Form.Label>Formatos de operação</Form.Label>
              <div className="segments-checkbox-grid">
                {segmentOptions.map(([value,label]) => <label className="form-check segment-check" key={value}><input className="form-check-input" type="checkbox" checked={segments.includes(value)} onChange={() => toggleSegment(value)} /><span className="form-check-label">{label}</span></label>)}
              </div>
            </Col>

            <Col xs={12} className="text-end">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Criar estabelecimento"}</Button>
            </Col>
          </Row>
        </Form>
      </main>
    </div>
  );
}

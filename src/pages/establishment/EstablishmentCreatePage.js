// src/pages/establishment/EstablishmentCreatePage.js
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../../config";
import NavlogComponent from "../../components/NavlogComponent";
import { Button, Col, Row, Form } from "react-bootstrap";
import "./Establishment.css";

const categoryOptions = [
  { value: "restaurante", label: "Restaurante" },
  { value: "hamburgueria", label: "Hamburgueria" },
  { value: "sorveteria", label: "Sorveteria" },
  { value: "fast_food", label: "Fast Food" },
  { value: "doceria", label: "Doceria" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "pizzaria", label: "Pizzaria" },
  { value: "pub", label: "Pub" },
];

const segmentOptions = [
  { value: "delivery", label: "Delivery" },
  { value: "retirada", label: "Retirada no local" },
  { value: "presencial", label: "Consumo no local" },
  { value: "balcao", label: "Balcão" },
  { value: "eventos", label: "Eventos" },
  { value: "catering", label: "Catering" },
  { value: "aniversarios", label: "Aniversários" },
  { value: "infantil", label: "Infantil" },
];

export default function EstablishmentCreatePage() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm();

  const navigate = useNavigate();

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [data, setData] = useState({});
  const [segments, setSegments] = useState([]);

const handleResizeImage = (file, setPreview, width, height, key) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (!file || !file.type.startsWith("image/")) {
      Swal.fire("Formato inválido", "Selecione uma imagem válida.", "error");
      reject();
      return;
    }
    reader.onloadend = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Preview visual (base64)
        const previewDataURL = canvas.toDataURL("image/png");
        setPreview(previewDataURL);

        // File para envio (sempre PNG)
        canvas.toBlob((blob) => {
          const filename = file.name.replace(/\.[^/.]+$/, "") + ".png";
          const resizedFile = new File([blob], filename, { type: "image/png" });
          setData((prev) => ({
            ...prev,
            [key]: resizedFile,
          }));
          resolve(resizedFile);
        }, "image/png", 0.95);
      };
      img.onerror = () => reject();
    };
    reader.readAsDataURL(file);
  });
};

const handleLogoChange = async (e) => {
  const file = e.target.files[0];
  await handleResizeImage(file, setLogoPreview, 150, 150, "logo");
};
const handleBackgroundChange = async (e) => {
  const file = e.target.files[0];
  await handleResizeImage(file, setBackgroundPreview, 1920, 600, "background");
};


  const handleSegmentsChange = (e) => {
    const { value, checked } = e.target;
    let newSegments = [...segments];
    if (checked) {
      newSegments.push(value);
    } else {
      newSegments = newSegments.filter((seg) => seg !== value);
    }
    setSegments(newSegments);
    setValue("segments", newSegments);
  };

const onSubmit = async (formDataInput) => {
  const token = localStorage.getItem("token");
  if (!token) {
    Swal.fire("Erro", "Você precisa estar autenticado.", "error");
    return;
  }
  if (!data.logo) {
    Swal.fire("Erro", "Adicione a logo do estabelecimento.", "error");
    return;
  }

  const formData = new FormData();
  for (const key in formDataInput) {
    if (key === "segments") {
      segments.forEach((segment) => {
        formData.append("segments[]", segment);
      });
    } else {
      formData.append(key, formDataInput[key]);
    }
  }
  if (data.logo) formData.append("logo", data.logo);
  if (data.background) formData.append("background", data.background);

  try {
    const response = await axios.post(
      `${apiBaseUrl}/establishment`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    Swal.fire("Sucesso", response.data.message, "success");
    navigate(`/establishment/view/${response.data.establishment.slug}`);
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Ocorreu um erro ao cadastrar o estabelecimento.";
    Swal.fire("Erro", message, "error");
  }
};


  return (
    <div className="establishment-root">
      <NavlogComponent />
      <div className="establishment-create-page">
        <h2 className="title">Criar Estabelecimento</h2>
        <Form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <Row>
            <Col xs={12} className="text-center">
              <div className="image-preview-container">
                {backgroundPreview && (
                  <label htmlFor="backgroundInput" style={{ cursor: "pointer" }}>
                    <img
                      src={backgroundPreview}
                      alt="Background Preview"
                      className="background-preview"
                    />
                  </label>
                )}
                {logoPreview && (
                  <label htmlFor="logoInput" className="logo-preview-wrapper" style={{ cursor: "pointer" }}>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="logo-preview"
                    />
                  </label>
                )}
              </div>
              <div className="d-flex justify-content-center gap-3 mb-4">
                <Button
                  variant="secondary"
                  className="action-button"
                  onClick={() => document.getElementById("backgroundInput").click()}
                >
                  Adicionar Background
                </Button>
                <Button
                  variant="secondary"
                  className="action-button"
                  onClick={() => document.getElementById("logoInput").click()}
                >
                  Adicionar Logo
                </Button>
              </div>
              <Form.Control
                id="backgroundInput"
                type="file"
                accept="image/*"
                onChange={handleBackgroundChange}
                style={{ display: "none" }}
              />
              <Form.Control
                id="logoInput"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: "none" }}
              />
            </Col>
          </Row>

          <div className="form">
            <Row className="gy-3">
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Nome*</label>
                  <input type="text" {...register("name", { required: true })} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Nome Fantasia</label>
                  <input type="text" {...register("fantasy")} />
                </div>
              </Col>
              <Col xs={6} md={3} lg={2}>
                <div className="form-group">
                  <label>CNPJ</label>
                  <input type="text" {...register("cnpj")} />
                </div>
              </Col>
              <Col xs={6} md={3} lg={2}>
                <div className="form-group">
                  <label>Tipo</label>
                  <input type="text" {...register("type")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Categoria*</label>
                  <select {...register("category", { required: true })} className="form-select">
                    <option value="">Selecione...</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Telefone</label>
                  <input type="text" {...register("phone")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" {...register("email")} />
                </div>
              </Col>
              <Col xs={12} md={12} lg={6}>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea {...register("description")} />
                </div>
              </Col>
              <Col xs={12} md={7} lg={4}>
                <div className="form-group">
                  <label>Endereço</label>
                  <input type="text" {...register("address")} />
                </div>
              </Col>
              <Col xs={6} md={3} lg={2}>
                <div className="form-group">
                  <label>Cidade</label>
                  <input type="text" {...register("city")} />
                </div>
              </Col>
              <Col xs={6} md={2} lg={2}>
                <div className="form-group">
                  <label>CEP</label>
                  <input type="text" {...register("cep")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Localização (Google Maps)</label>
                  <input type="text" {...register("location")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Instagram</label>
                  <input type="url" {...register("instagram_url")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Facebook</label>
                  <input type="url" {...register("facebook_url")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Twitter</label>
                  <input type="url" {...register("twitter_url")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>YouTube</label>
                  <input type="url" {...register("youtube_url")} />
                </div>
              </Col>
              <Col xs={12} md={6} lg={4}>
                <div className="form-group">
                  <label>Site</label>
                  <input type="url" {...register("website_url")} />
                </div>
              </Col>

             <Col xs={12} md={6} lg={6}>
  <div className="form-group">
    <label>Segmentos Atendidos</label>
    <div className="segments-checkbox-grid">
      {segmentOptions.map((option) => (
        <div className="form-check segment-check" key={option.value}>
          <input
            className="form-check-input"
            type="checkbox"
            id={`segment-${option.value}`}
            value={option.value}
            checked={segments.includes(option.value)}
            onChange={handleSegmentsChange}
          />
          <label
            className="form-check-label mr-2"
            htmlFor={`segment-${option.value}`}
          >
             {option.label}
          </label>
        </div>
      ))}
    </div>
    <input
      type="hidden"
      {...register("segments")}
      value={segments}
    />
  </div>
</Col>

              <Col xs={12} className="text-end">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Salvando..." : "Criar Estabelecimento"}
                </button>
              </Col>
            </Row>
          </div>
        </Form>
      </div>
    </div>
  );
}

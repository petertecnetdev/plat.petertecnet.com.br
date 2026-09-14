import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import { apiBaseUrl, appId } from "../../config";
import { acquisitionTelemetryMetadata, captureAcquisitionAttribution } from "../../utils/acquisitionAttribution";
import "./Item.css";

const apiMessage = (error, fallback) => error?.response?.data?.message
  || error?.response?.data?.error
  || (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "")
  || fallback;

const initials = (value, fallback = "IT") => {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const copyToClipboard = async (value) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Clipboard API can be denied in PWA/WebView; legacy fallback below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

const sharePublicMenu = async (establishment) => {
  const path = `/establishment/view/${encodeURIComponent(establishment.slug)}`;
  const url = new URL(path, window.location.origin).toString();
  const title = establishment.fantasy || establishment.name || "Cardápio Plat";
  try {
    if (navigator.share) {
      await navigator.share({ title, text: `Confira o cardápio de ${title} na Plat.`, url });
      return;
    }
  } catch (error) {
    if (error?.name === "AbortError") return;
  }
  const copied = await copyToClipboard(url);
  if (copied) {
    await Swal.fire("Link copiado", "O link do seu cardápio público está pronto para enviar aos clientes.", "success");
    return;
  }
  await Swal.fire({ title: "Compartilhe seu cardápio", text: url, icon: "info", confirmButtonText: "Entendi" });
};

export default function ItemCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;
  const acquisition = useMemo(
    () => captureAcquisitionAttribution(location.state?.acquisition || {}),
    [location.state],
  );
  const initialItemType = onboarding ? String(location.state?.itemType || "product") : "";
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      type: initialItemType,
      status: "1",
      limited_by_user: "0",
      is_featured: "0",
      stock: "",
    },
  });
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const itemName = watch("name");
  const description = watch("description");
  const price = watch("price");

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
        if (Number(est.app_id) !== Number(appId)) throw new Error("Este estabelecimento não pertence à Plat.");
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

  useEffect(() => {
    if (!onboarding || !establishment?.id) return;
    try {
      window.PeterTecnetTelemetry?.track?.("plat_first_catalog_item_started", {
        label: establishment.name || establishment.fantasy || "Estabelecimento",
        target: "item_create",
        metadata: {
          establishment_id: establishment.id,
          establishment_slug: establishment.slug,
          onboarding: true,
          fast_path: true,
          ...acquisitionTelemetryMetadata(acquisition),
        },
      });
    } catch (_) {
      // Telemetry must never interrupt activation.
    }
  }, [onboarding, establishment, acquisition]);

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
      type: String(data.type || (onboarding ? "product" : "")).trim(),
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      try {
        window.PeterTecnetTelemetry?.track?.("plat_first_catalog_item_created", {
          label: normalized.name,
          target: "item_create",
          metadata: {
            establishment_id: establishment.id,
            establishment_slug: establishment.slug,
            item_type: normalized.type,
            category: normalized.category || "",
            onboarding,
            fast_path: onboarding,
            ...acquisitionTelemetryMetadata(acquisition),
          },
        });
      } catch (_) {
        // Telemetry must not interrupt onboarding.
      }

      if (onboarding) {
        try {
          window.PeterTecnetTelemetry?.track?.("plat_onboarding_ordering_required", {
            label: normalized.name,
            target: "first_catalog_item",
            metadata: {
              establishment_id: establishment.id,
              establishment_slug: establishment.slug,
              next_step: "ordering_settings",
              ...acquisitionTelemetryMetadata(acquisition),
            },
          });
        } catch (_) {
          // Telemetry must not interrupt onboarding.
        }
        await Swal.fire({
          title: "Primeiro item criado. Agora deixe o cardápio pronto para vender.",
          text: "Antes de divulgar, ative os pedidos, escolha entrega/retirada e configure os meios de pagamento. Assim o primeiro cliente já consegue comprar.",
          icon: "success",
          confirmButtonText: "Configurar pedidos e começar a vender",
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        navigate(`/establishment/${establishment.id}/ordering-settings`, {
          replace: true,
          state: { onboarding: true, source: "first-item-created", acquisition },
        });
        return;
      }

      const next = await Swal.fire({
        title: "Item criado. Agora coloque seu cardápio na rua.",
        text: "Compartilhe o cardápio com clientes agora ou configure os pedidos antes de divulgar.",
        icon: "success",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Compartilhar cardápio",
        denyButtonText: "Configurar pedidos",
        cancelButtonText: "Ver cardápio",
        reverseButtons: true,
      });
      if (next.isDenied) {
        navigate(`/establishment/${establishment.id}/ordering-settings`, {
          state: { onboarding: false, source: "item-created", acquisition },
        });
        return;
      }
      if (next.isConfirmed) await sharePublicMenu(establishment);
      navigate(`/establishment/view/${establishment.slug}`, {
        state: { onboarding: false, source: "item-created", acquisition },
      });
    } catch (error) {
      Swal.fire(
        "Erro",
        apiMessage(error, "Não foi possível criar o item."),
        error?.response?.status === 422 ? "warning" : "error",
      );
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}><Spinner animation="border" variant="warning" /></div>;
  }

  return <>
    <NavlogComponent />
    <Container className="main-container" fluid>
      <Row className="mb-3 align-items-center">
        <Col>
          <span className="text-muted">{establishment?.name}</span>
          <h1 className="page-header mb-0">{onboarding ? "Adicione seu primeiro item" : "Novo item"}</h1>
          {onboarding && <p className="text-secondary mb-0 mt-2">Só nome, preço e estoque são necessários agora. A Plat configura o item como produto ativo para você começar a vender mais rápido.</p>}
        </Col>
        {!onboarding && <Col className="text-end"><Button variant="secondary" onClick={() => navigate(`/item/list/${establishment.slug}`)}>Voltar</Button></Col>}
      </Row>

      <section className="plat-item-preview-card">
        <label htmlFor="imageInput" className="plat-item-preview-media">
          {imagePreview ? <img src={imagePreview} alt="Prévia do item" /> : <span className="plat-item-preview-initials">{initials(itemName)}</span>}
          <span className="plat-item-preview-change">{imagePreview ? "Trocar imagem" : "Adicionar imagem"}</span>
        </label>
        <div className="plat-item-preview-copy">
          <span className="plat-create-preview-label">Prévia do item</span>
          <h2>{itemName || "Nome do item"}</h2>
          <p>{description || (onboarding ? "Você poderá completar descrição, categoria, marca e disponibilidade depois." : "A descrição do item aparecerá aqui.")}</p>
          {price !== undefined && price !== "" && <strong>R$ {Number(price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>}
        </div>
        <Form.Control id="imageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
      </section>

      <Form className="card-container" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        {onboarding && <div className="alert alert-info mb-4" role="status"><strong>Etapa 2 de 3:</strong> cadastre um item vendável. Depois a Plat leva você direto para ativar pedidos, pagamento e divulgação.</div>}
        <Row className="g-3">
          <Col md={onboarding ? 6 : 6}>
            <Form.Group>
              <Form.Label>Nome*</Form.Label>
              <Form.Control autoFocus placeholder={onboarding ? "Ex.: X-Burger, Café especial, Combo almoço" : undefined} {...register("name", { required: true })} />
            </Form.Group>
          </Col>

          {onboarding
            ? <input type="hidden" {...register("type", { required: true })} />
            : <Col md={6}><Form.Group><Form.Label>Tipo*</Form.Label><Form.Select {...register("type", { required: true })}><option value="">Selecione</option><option value="product">Produto</option><option value="service">Serviço</option></Form.Select></Form.Group></Col>}

          <Col md={onboarding ? 3 : 3}>
            <Form.Group>
              <Form.Label>Preço (R$)*</Form.Label>
              <Form.Control type="number" min="0" step="0.01" inputMode="decimal" placeholder={onboarding ? "Ex.: 29,90" : undefined} {...register("price", { required: true })} />
            </Form.Group>
          </Col>
          <Col md={onboarding ? 3 : 3}>
            <Form.Group>
              <Form.Label>Estoque{onboarding ? "*" : ""}</Form.Label>
              <Form.Control type="number" min={onboarding ? "1" : "0"} required={onboarding} inputMode="numeric" placeholder={onboarding ? "Ex.: 20" : "0"} {...register("stock")} />
              {onboarding && <Form.Text className="text-muted">Quantas unidades podem ser vendidas agora.</Form.Text>}
            </Form.Group>
          </Col>

          {!onboarding && <>
            <Col xs={12}><Form.Group><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} {...register("description")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Categoria</Form.Label><Form.Control {...register("category")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Subcategoria</Form.Label><Form.Control {...register("subcategory")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Marca</Form.Label><Form.Control {...register("brand")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Status</Form.Label><Form.Select {...register("status")}><option value="1">Ativo</option><option value="0">Inativo</option></Form.Select></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Destaque</Form.Label><Form.Select {...register("is_featured")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Disponível de</Form.Label><Form.Control type="datetime-local" {...register("availability_start")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Até</Form.Label><Form.Control type="datetime-local" {...register("availability_end")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Expira em</Form.Label><Form.Control type="date" {...register("expiration_date")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Desconto</Form.Label><Form.Control type="number" min="0" step="0.01" {...register("discount")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Limitado por usuário</Form.Label><Form.Select {...register("limited_by_user")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col xs={12}><Form.Group><Form.Label>Notas</Form.Label><Form.Control as="textarea" rows={2} {...register("notes")} /></Form.Group></Col>
          </>}

          <Col xs={12} className="text-end">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner animation="border" size="sm" /> : onboarding ? "Criar item e configurar pedidos" : "Criar item"}</Button>
          </Col>
        </Row>
      </Form>
    </Container>
  </>;
}

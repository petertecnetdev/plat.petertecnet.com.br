import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import creativeService from "../../services/CreativeService";
import { apiBaseUrl, appId } from "../../config";
import { acquisitionTelemetryMetadata, captureAcquisitionAttribution } from "../../utils/acquisitionAttribution";
import "./Item.css";
import "./ItemQuickCreate.css";

const message = (error, fallback) => error?.response?.data?.message
  || error?.response?.data?.error
  || (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "")
  || fallback;

const initials = (value) => String(value || "IT").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

const dataUriToFile = (dataUri, name) => {
  const [meta, encoded] = String(dataUri || "").split(",");
  if (!encoded) throw new Error("Imagem gerada inválida.");
  const mime = meta.match(/data:([^;]+);base64/i)?.[1] || "image/jpeg";
  const raw = atob(encoded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return new File([bytes], name, { type: mime });
};

export default function ItemQuickCreatePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = location.state?.onboarding === true;
  const acquisition = useMemo(() => captureAcquisitionAttribution(location.state?.acquisition || {}), [location.state]);
  const {
    register, handleSubmit, watch, getValues, setValue, reset, setFocus,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      type: String(location.state?.itemType || "product"),
      status: "1",
      is_featured: "0",
      limited_by_user: "0",
      stock: "",
    },
  });

  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advanced, setAdvanced] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [generatingText, setGeneratingText] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const name = watch("name");
  const type = watch("type") || "product";
  const price = watch("price");
  const description = watch("description");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${apiBaseUrl}/establishment/view/${encodeURIComponent(slug)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const current = data?.establishment || data;
        if (!current?.id || Number(current.app_id) !== Number(appId)) throw new Error("Estabelecimento inválido.");
        if (active) setEstablishment(current);
      } catch (error) {
        await Swal.fire("Erro", message(error, "Não foi possível carregar o estabelecimento."), "error");
        navigate("/establishment", { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug, navigate]);

  const currentPayload = () => {
    const values = getValues();
    return {
      subject: String(values.name || "").trim(),
      item_type: values.type || "product",
      category: String(values.category || "").trim() || undefined,
      subcategory: String(values.subcategory || "").trim() || undefined,
      brand: String(values.brand || "").trim() || undefined,
      catalog_name: establishment?.fantasy || establishment?.name || undefined,
    };
  };

  const requireName = async () => {
    if (String(getValues("name") || "").trim().length >= 2) return true;
    await Swal.fire("Digite o nome primeiro", "A IA usa o nome como ponto de partida e evita fazer perguntas desnecessárias.", "info");
    setFocus("name");
    return false;
  };

  const improveDescription = async () => {
    if (!(await requireName()) || generatingText) return;
    setGeneratingText(true);
    try {
      const result = await creativeService.generateCatalogDescription({
        ...currentPayload(),
        current_description: String(getValues("description") || "").trim() || undefined,
        tone: "commercial",
      });
      if (!result?.description) throw new Error("A IA não retornou uma descrição.");
      setValue("description", result.description, { shouldDirty: true });
    } catch (error) {
      await Swal.fire("Descrição não gerada", message(error, "Tente novamente em instantes."), "warning");
    } finally {
      setGeneratingText(false);
    }
  };

  const generateImage = async () => {
    if (!(await requireName()) || generatingImage) return;
    setGeneratingImage(true);
    try {
      const result = await creativeService.generateCatalogImage({
        ...currentPayload(),
        description: String(getValues("description") || "").trim() || undefined,
      });
      const dataUri = result?.image?.data_uri;
      if (!dataUri) throw new Error("A IA não retornou uma imagem.");
      setImageFile(dataUriToFile(dataUri, `item-ia.${result?.image?.mime_type === "image/png" ? "png" : "jpg"}`));
      setPreview(dataUri);
    } catch (error) {
      await Swal.fire("Imagem não gerada", message(error, "Tente novamente ou envie uma foto."), "warning");
    } finally {
      setGeneratingImage(false);
    }
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      Swal.fire("Imagem inválida", "Use JPG, PNG ou WebP com até 8 MB.", "warning");
      return;
    }
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const clearForNext = (keepType) => {
    reset({ type: keepType || "product", status: "1", is_featured: "0", limited_by_user: "0", stock: "" });
    setImageFile(null);
    setPreview(null);
    setAdvanced(false);
    setTimeout(() => setFocus("name"), 80);
  };

  const save = async (values, createAnother = false) => {
    if (!establishment?.id) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    const normalized = {
      ...values,
      name: String(values.name || "").trim(),
      type: values.type || "product",
      price: values.price,
      status: values.status === "0" ? "0" : "1",
      is_featured: values.is_featured === "1" ? "1" : "0",
      limited_by_user: values.limited_by_user === "1" ? "1" : "0",
    };
    Object.entries(normalized).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) formData.append(key, value);
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
        window.PeterTecnetTelemetry?.track?.("plat_catalog_item_created", {
          label: normalized.name,
          target: "item_create",
          metadata: {
            establishment_id: establishment.id,
            item_type: normalized.type,
            fast_path: true,
            ...acquisitionTelemetryMetadata(acquisition),
          },
        });
      } catch (_) { /* telemetry cannot block creation */ }

      if (createAnother && !onboarding) {
        await Swal.fire({ toast: true, position: "top-end", icon: "success", title: `${normalized.name} criado`, showConfirmButton: false, timer: 1200 });
        clearForNext(normalized.type);
        return;
      }

      if (onboarding) {
        await Swal.fire("Item criado", "Agora vamos ativar pedidos, entrega/retirada e pagamento.", "success");
        navigate(`/establishment/${establishment.id}/ordering-settings`, { replace: true, state: { onboarding: true, acquisition } });
        return;
      }

      navigate(`/item/list/${establishment.slug}`);
    } catch (error) {
      await Swal.fire("Não foi possível criar o item", message(error, "Revise os dados e tente novamente."), error?.response?.status === 422 ? "warning" : "error");
    }
  };

  if (loading) return <div className="spinner-center"><Spinner animation="border" variant="warning" /></div>;

  return <>
    <NavlogComponent />
    <Container className="main-container plat-item-create-page" fluid>
      <div className="plat-quick-header">
        <div>
          <span className="text-muted">{establishment?.fantasy || establishment?.name}</span>
          <div className="d-flex flex-wrap align-items-center gap-2"><h1 className="page-header mb-0">Novo item</h1><span className="plat-fast-badge">Cadastro rápido</span></div>
          <p>Nome, tipo e preço bastam. O restante é opcional e fica escondido para não atrapalhar.</p>
        </div>
        {!onboarding && <Button variant="secondary" onClick={() => navigate(`/item/list/${establishment.slug}`)}>Voltar</Button>}
      </div>

      <section className="plat-smart-preview">
        <div className="plat-smart-preview__media">
          <label htmlFor="imageInput">
            {preview ? <img src={preview} alt="Prévia do item" /> : <span>{initials(name)}</span>}
            <small>{preview ? "Trocar foto" : "Enviar foto"}</small>
          </label>
          <Form.Control id="imageInput" type="file" accept="image/*" onChange={chooseImage} hidden />
          <Button type="button" className="plat-ai-button" onClick={generateImage} disabled={generatingImage}>
            {generatingImage ? <><Spinner size="sm" /> Criando...</> : <><i className="fa-solid fa-wand-magic-sparkles" /> Gerar imagem com IA</>}
          </Button>
        </div>
        <div className="plat-smart-preview__copy">
          <span>Prévia no cardápio</span><h2>{name || "Nome do item"}</h2>
          <p>{description || "Escreva do seu jeito ou deixe a IA criar uma descrição curta."}</p>
          {price !== "" && price !== undefined && <strong>R$ {Number(price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>}
        </div>
      </section>

      <Form className="card-container plat-quick-form" onSubmit={handleSubmit((data) => save(data, false))}>
        <Row className="g-3">
          <Col lg={7}><Form.Group><Form.Label>Nome*</Form.Label><Form.Control autoFocus placeholder="Ex.: X-Burger, Coca-Cola, Corte masculino" {...register("name", { required: true, minLength: 2 })} /></Form.Group></Col>
          <Col lg={5}><Form.Group><Form.Label>Tipo*</Form.Label><input type="hidden" {...register("type", { required: true })} /><div className="plat-item-type-switch"><button type="button" className={type === "product" ? "is-active" : ""} onClick={() => setValue("type", "product")}>Produto</button><button type="button" className={type === "service" ? "is-active" : ""} onClick={() => setValue("type", "service")}>Serviço</button></div></Form.Group></Col>
          <Col md={type === "product" ? 6 : 12}><Form.Group><Form.Label>Preço (R$)*</Form.Label><Form.Control type="number" min="0" step="0.01" inputMode="decimal" placeholder="29,90" {...register("price", { required: true, min: 0 })} /></Form.Group></Col>
          {type === "product" && <Col md={6}><Form.Group><Form.Label>Estoque <small>opcional</small></Form.Label><Form.Control type="number" min="0" placeholder="Informe apenas se controlar estoque" {...register("stock")} /></Form.Group></Col>}
          <Col xs={12}><Form.Group><div className="plat-field-head"><Form.Label>Descrição <small>opcional</small></Form.Label><Button type="button" className="plat-ai-button" onClick={improveDescription} disabled={generatingText}>{generatingText ? <><Spinner size="sm" /> Escrevendo...</> : <><i className="fa-solid fa-wand-magic-sparkles" /> {String(description || "").trim() ? "Melhorar com IA" : "Criar com IA"}</>}</Button></div><Form.Control as="textarea" rows={3} placeholder="Escreva normalmente. A IA preserva os fatos e melhora o texto." {...register("description")} /></Form.Group></Col>
        </Row>

        {!onboarding && <div className="plat-advanced-block">
          <Button type="button" className="plat-advanced-toggle" onClick={() => setAdvanced((open) => !open)}><span><i className="fa-solid fa-sliders" /> Mais opções</span><small>Categoria, desconto, disponibilidade e notas</small><i className={`fa-solid fa-chevron-${advanced ? "up" : "down"}`} /></Button>
          {advanced && <Row className="g-3 plat-advanced-fields">
            <Col md={4}><Form.Group><Form.Label>Categoria</Form.Label><Form.Control {...register("category")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Subcategoria</Form.Label><Form.Control {...register("subcategory")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Marca</Form.Label><Form.Control {...register("brand")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Status</Form.Label><Form.Select {...register("status")}><option value="1">Ativo</option><option value="0">Inativo</option></Form.Select></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Destaque</Form.Label><Form.Select {...register("is_featured")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Desconto</Form.Label><Form.Control type="number" min="0" step="0.01" {...register("discount")} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Limite por usuário</Form.Label><Form.Select {...register("limited_by_user")}><option value="0">Não</option><option value="1">Sim</option></Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Disponível de</Form.Label><Form.Control type="datetime-local" {...register("availability_start")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Até</Form.Label><Form.Control type="datetime-local" {...register("availability_end")} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Expira em</Form.Label><Form.Control type="date" {...register("expiration_date")} /></Form.Group></Col>
            <Col xs={12}><Form.Group><Form.Label>Notas internas</Form.Label><Form.Control as="textarea" rows={2} {...register("notes")} /></Form.Group></Col>
          </Row>}
        </div>}

        <div className="plat-item-submit-bar">
          {!onboarding && <Button type="button" variant="outline-secondary" disabled={isSubmitting} onClick={handleSubmit((data) => save(data, true))}>Salvar e adicionar outro</Button>}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Spinner size="sm" /> Salvando...</> : onboarding ? "Criar e continuar" : "Criar item"}</Button>
        </div>
      </Form>
    </Container>
  </>;
}

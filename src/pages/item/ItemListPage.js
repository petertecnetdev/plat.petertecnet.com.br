import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, appId, storageUrl } from "../../config";
import "./Item.css";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
const apiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") || fallback;
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const itemImage = (item) => {
  const file = Array.isArray(item?.files) ? item.files.find((entry) => entry?.path) : null;
  return file?.path ? `${storageUrl}/${file.path}` : item?.image ? `${storageUrl}/${item.image}` : "/images/itemimage.png";
};

export default function ItemListPage() {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      const [estRes, itemRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/establishment/view/${encodeURIComponent(slug)}`, { params: { app_id: appId }, headers }),
        axios.get(`${apiBaseUrl}/item/list-by-entity/${encodeURIComponent(slug)}`, { headers }),
      ]);
      const est = estRes.data?.establishment || estRes.data;
      if (!est?.id || Number(est.app_id) !== Number(appId)) throw new Error("Estabelecimento inválido para a Plat.");
      setEstablishment(est);
      setItems(Array.isArray(itemRes.data?.items) ? itemRes.data.items : []);
    } catch (error) {
      setItems([]);
      Swal.fire("Erro", apiMessage(error, "Não foi possível carregar os itens."), "error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category || "Sem categoria"))), [items]);
  const visibleItems = useMemo(() => selectedCategory === "all" ? items : items.filter((item) => (item.category || "Sem categoria") === selectedCategory), [items, selectedCategory]);

  const changePrices = async (direction) => {
    if (!establishment?.id) return;
    const { value } = await Swal.fire({ title: direction === "increase" ? "Aumentar preços" : "Reduzir preços", input: "number", inputLabel: "Porcentagem (%)", inputAttributes: { min: 0, max: 100, step: 0.01 }, showCancelButton: true, confirmButtonText: "Aplicar" });
    if (value === undefined || value === null || value === "") return;
    try {
      await axios.post(`${apiBaseUrl}/item/${direction === "increase" ? "increase-prices" : "decrease-prices"}`, { entity_id: establishment.id, percentage: Number(value) }, { headers: authHeaders() });
      await load();
      Swal.fire("Sucesso", "Preços atualizados.", "success");
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível atualizar os preços."), "error");
    }
  };

  const removeItem = async (item) => {
    const result = await Swal.fire({ title: "Excluir item?", text: `O item “${item.name}” será removido.`, icon: "warning", showCancelButton: true, confirmButtonText: "Excluir", cancelButtonText: "Cancelar" });
    if (!result.isConfirmed) return;
    try {
      await axios.delete(`${apiBaseUrl}/item/${item.id}`, { headers: authHeaders() });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      Swal.fire("Excluído", "Item removido com sucesso.", "success");
    } catch (error) {
      Swal.fire("Erro", apiMessage(error, "Não foi possível excluir o item."), "error");
    }
  };

  return (
    <>
      <NavlogComponent />
      <Container className="main-container" fluid>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div><span className="text-muted">{establishment?.name || "Plat"}</span><h1 className="page-header mb-0">Itens</h1></div>
          <div className="d-flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => changePrices("increase")}>Aumentar preços</Button>
            <Button variant="secondary" onClick={() => changePrices("decrease")}>Reduzir preços</Button>
            {establishment?.slug && <Button as={Link} to={`/item/create/${establishment.slug}`} variant="primary">+ Novo item</Button>}
          </div>
        </div>

        {categories.length > 0 && <div className="d-flex flex-wrap gap-2 mb-4"><Button size="sm" variant={selectedCategory === "all" ? "warning" : "secondary"} onClick={() => setSelectedCategory("all")}>Todos</Button>{categories.map((category) => <Button key={category} size="sm" variant={selectedCategory === category ? "warning" : "secondary"} onClick={() => setSelectedCategory(category)}>{category}</Button>)}</div>}

        {loading ? <ProcessingIndicatorComponent compact messages={["Carregando itens…"]} /> : visibleItems.length === 0 ? (
          <section className="card-container text-center py-5"><h2 className="h5">Nenhum item encontrado</h2><p className="text-muted">Cadastre produtos ou serviços para começar a receber pedidos.</p>{establishment?.slug && <Button as={Link} to={`/item/create/${establishment.slug}`}>Criar item</Button>}</section>
        ) : (
          <Row className="g-4">
            {visibleItems.map((item) => <Col key={item.id} xs={12} sm={6} lg={4} xl={3}><Card className="card-component h-100"><Card.Img variant="top" src={itemImage(item)} alt={item.name} style={{ height: 190, objectFit: "cover" }} onError={(e) => { e.currentTarget.src = "/images/itemimage.png"; }} /><Card.Body className="d-flex flex-column"><div className="d-flex justify-content-between gap-2"><Card.Title>{item.name}</Card.Title><Badge bg={item.status ? "success" : "secondary"}>{item.status ? "Ativo" : "Inativo"}</Badge></div><Card.Subtitle className="mb-2 text-muted">{item.category || item.type || "Item"}</Card.Subtitle><Card.Text className="flex-grow-1">{item.description || "Sem descrição."}</Card.Text><strong>{money(item.price)}</strong></Card.Body><Card.Footer className="d-flex gap-2"><Button as={Link} to={`/item/update/${item.id}`} size="sm" variant="secondary">Editar</Button><Button size="sm" variant="danger" onClick={() => removeItem(item)}>Excluir</Button></Card.Footer></Card></Col>)}
          </Row>
        )}
      </Container>
    </>
  );
}

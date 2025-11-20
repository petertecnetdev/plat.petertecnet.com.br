// src/hooks/useOrderUpdate.js
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";

export default function useOrderUpdate() {
  const { entityId, id: orderId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [estId, setEstId] = useState(null);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");
  const [orderLines, setOrderLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    origin: "Balcão",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: ""
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const [resItems, resEst, resOrder] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiBaseUrl}/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setProducts(resItems.data);

        const est = resEst.data.establishment;
        setEstId(est.id);
        setEstName(est.name.toUpperCase());
        setEstLogo(est.logo || "");

        const o = resOrder.data.order;

        setForm({
          customer_name: o.customer_name,
          origin: o.origin,
          fulfillment: o.fulfillment,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          notes: o.notes || ""
        });

        setOrderLines(
          (o.items || []).map((it) => ({
            product: it.item,
            quantity: it.quantity,
            additions: (it.modifiers || [])
              .filter((m) => String(m.type).toLowerCase() === "addition")
              .map((m) => ({
                id: m.modifier_id ?? m.modifier?.id ?? m.modifierId,
                quantity: m.quantity ?? 1
              })),
            removals: (it.modifiers || [])
              .filter((m) => String(m.type).toLowerCase() === "removal")
              .map((m) => m.modifier_id ?? m.modifier?.id ?? m.modifierId)
          }))
        );
      } catch {
        Swal.fire("Erro", "Falha ao carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId, orderId]);

  const formattedTotal = useMemo(() => {
    let t = 0;
    orderLines.forEach((line) => {
      t += Number(line.quantity) * Number(line.product.price);
      line.additions.forEach((a) => {
        const prod = products.find((p) => p.id === a.id);
        if (prod) t += Number(prod.price) * Number(a.quantity);
      });
    });
    return `R$${t.toFixed(2).replace(".", ",")}`;
  }, [orderLines, products]);

  const openAddItemModal = () => {
    setModalMode("add");
    setModalItems(products);
    setModalOpen(true);
  };

  const openAdditionsModal = (index) => {
    const adds = products.filter(
      (p) => String(p.category || "").toLowerCase() === "adicionais"
    );
    setModalIndex(index);
    setModalItems(adds);
    setModalMode("additions");
    setModalOpen(true);
  };

  const openRemovalsModal = (index) => {
    const adds = products.filter(
      (p) => String(p.category || "").toLowerCase() === "adicionais"
    );
    setModalIndex(index);
    setModalItems(adds);
    setModalMode("removals");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setModalIndex(null);
    setModalItems([]);
  };

  const handleAddItem = (line) => {
    setOrderLines((prev) => [...prev, line]);
    closeModal();
  };

  const handleSaveAdditions = (index, data) => {
    setOrderLines((prev) => {
      const copy = [...prev];
      copy[index].additions = data.map((it) => ({
        id: it.id,
        quantity: it.quantity
      }));
      return copy;
    });
    closeModal();
  };

  const handleSaveRemovals = (index, ids) => {
    setOrderLines((prev) => {
      const copy = [...prev];
      copy[index].removals = ids;
      return copy;
    });
    closeModal();
  };

  const handleRemoveLine = (index) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuantity = (index, type) => {
    setOrderLines((prev) => {
      const copy = [...prev];
      const q = Number(copy[index].quantity);
      copy[index].quantity = type === "inc" ? q + 1 : Math.max(1, q - 1);
      return copy;
    });
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      app_id: appId,
      entity_name: "establishment",
      entity_id: Number(entityId),
      customer_name: form.customer_name,
      origin: form.origin,
      fulfillment: form.fulfillment,
      payment_status: form.payment_status,
      payment_method: form.payment_method,
      notes: form.notes,
      items: orderLines.map((l) => ({
        item_id: l.product.id,
        quantity: l.quantity,
        additions: l.additions.flatMap((a) => Array(a.quantity).fill(a.id)),
        removals: l.removals
      }))
    };

    try {
      const token = localStorage.getItem("token");

      await axios.put(`${apiBaseUrl}/order/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire("Sucesso", "Pedido atualizado com sucesso.", "success");
      navigate(`/order/list/${entityId}`);
    } catch (err) {
      if (err.response?.status === 422) {
        const msgs = Object.values(err.response.data.errors || {}).flat();
        Swal.fire("Erro de Validação", msgs.join("\n"), "warning");
      } else {
        Swal.fire("Erro", "Não foi possível atualizar o pedido.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    estId,
    estName,
    estLogo,
    products,
    orderLines,
    formattedTotal,
    form,
    submitting,
    modalOpen,
    modalMode,
    modalIndex,
    modalItems,
    openAddItemModal,
    openAdditionsModal,
    openRemovalsModal,
    closeModal,
    handleAddItem,
    handleSaveAdditions,
    handleSaveRemovals,
    handleRemoveLine,
    handleQuantity,
    handleFormChange,
    handleSubmit
  };
}

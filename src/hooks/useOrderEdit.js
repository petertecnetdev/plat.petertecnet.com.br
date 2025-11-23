// src/hooks/useOrderEdit.js
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";
import { useParams, useNavigate } from "react-router-dom";

export default function useOrderEdit() {
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
    notes: "",
    id: null,
    date: null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);
  const [modalInitialAdditions, setModalInitialAdditions] = useState([]);
  const [modalInitialRemovals, setModalInitialRemovals] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const [resItems, resEst, resOrder] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: { entity_name: "establishment", entity_id: entityId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/order/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProducts(resItems.data);

        const est = resEst.data.establishment;
        setEstId(est.id);
        setEstName((est.name || "").toUpperCase());
        setEstLogo(est.logo || "");

        const o = resOrder.data.order;

        setForm({
          customer_name: o.customer_name,
          id: o.id,
          date: o.created_at,
          origin: o.origin,
          fulfillment: o.fulfillment,
          payment_status: o.payment_status,
          payment_method: o.payment_method,
          notes: o.notes || "",
        });

        setOrderLines(
          (o.items || []).map((it) => ({
            product: it.item,
            quantity: it.quantity,
            additions:
              (it.modifiers || [])
                .filter(
                  (m) =>
                    String(m.type || "").toLowerCase().trim() === "addition"
                )
                .map((m) => ({
                  id: m.modifier_id ?? m.modifier?.id ?? m.modifierId,
                  quantity: m.quantity || 1,
                })) || [],
            removals:
              (it.modifiers || [])
                .filter(
                  (m) =>
                    String(m.type || "").toLowerCase().trim() === "removal"
                )
                .map(
                  (m) => m.modifier_id ?? m.modifier?.id ?? m.modifierId
                ) || [],
          }))
        );
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId, orderId]);

  const total = useMemo(() => {
    let t = 0;

    (orderLines || []).forEach((line) => {
      const qty = line.quantity || 1;
      t += qty * Number(line.product?.price || 0);

      (line.additions || []).forEach((a) => {
        const prod = products.find((p) => p.id === a.id);
        if (prod) t += Number(prod.price) * (a.quantity || 1);
      });
    });

    return t;
  }, [orderLines, products]);

  const formattedTotal = `R$${total.toFixed(2).replace(".", ",")}`;

  const openAddItemModal = () => {
    setModalItems(products);
    setModalMode("add");
    setModalIndex(null);
    setModalOpen(true);
  };

  const openAdditionsModal = (index) => {
    setModalMode("additions");
    setModalIndex(index);
    setModalInitialAdditions(orderLines[index].additions || []);
    setModalInitialRemovals([]);
    setModalOpen(true);
  };

  const openRemovalsModal = (index) => {
    setModalMode("removals");
    setModalIndex(index);
    setModalInitialAdditions([]);
    setModalInitialRemovals(orderLines[index].removals || []);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleAddItem = (data) => {
    setOrderLines((prev) => [
      ...prev,
      {
        ...data,
        additions: [],
        removals: [],
      },
    ]);
    closeModal();
  };

  const handleSaveAdditions = (index, data) => {
    setOrderLines((prev) => {
      const copy = [...prev];
      copy[index].additions = data;
      return copy;
    });
    closeModal();
  };

  const handleSaveRemovals = (index, data) => {
    setOrderLines((prev) => {
      const copy = [...prev];
      copy[index].removals = data;
      return copy;
    });
    closeModal();
  };

  const handleRemoveLine = (i) =>
    setOrderLines((prev) => prev.filter((_, idx) => idx !== i));

  const handleQuantity = (i, type) =>
    setOrderLines((prev) => {
      const copy = [...prev];
      const q = copy[i].quantity || 1;
      copy[i].quantity = type === "inc" ? q + 1 : Math.max(1, q - 1);
      return copy;
    });

  const handleFormChange = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      app_id: appId,
      entity_name: "establishment",
      entity_id: +entityId,
      items: orderLines.map((l) => ({
        item_id: l.product.id,
        quantity: l.quantity,
        additions: (l.additions || []).flatMap((a) =>
          Array(a.quantity).fill(a.id)
        ),
        removals: l.removals || [],
      })),
      ...form,
    };

    try {
      const token = localStorage.getItem("token");

      await axios.put(`${apiBaseUrl}/order/${orderId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: "success",
        title: "Pedido atualizado!",
        timer: 1200,
        showConfirmButton: false,
      });

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
    formattedTotal,
    orderLines,
    form,
    submitting,
    products,
    modalOpen,
    modalMode,
    modalIndex,
    modalItems,
    modalInitialAdditions,
    modalInitialRemovals,
    openAddItemModal,
    openAdditionsModal,
    openRemovalsModal,
    handleAddItem,
    handleSaveAdditions,
    handleSaveRemovals,
    handleRemoveLine,
    handleQuantity,
    handleSubmit,
    handleFormChange,
    closeModal,
  };
}

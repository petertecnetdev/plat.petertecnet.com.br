// ====================== useOrderCreate.js ======================
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";
import { useParams, useNavigate } from "react-router-dom";

export default function useOrderCreate() {
  const { entityId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [estId, setEstId] = useState(null);
  const [estName, setEstName] = useState("");
  const [estLogo, setEstLogo] = useState("");

  const [orderLines, setOrderLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);
  const [modalInitialAdditions, setModalInitialAdditions] = useState([]);
  const [modalInitialRemovals, setModalInitialRemovals] = useState([]);

  const [form, setForm] = useState({
    customer_name: "",
    origin: "Balcão",
    fulfillment: "dine-in",
    payment_status: "pending",
    payment_method: "Dinheiro",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const [resItems, resEst] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
            params: {
              entity_name: "establishment",
              entity_id: entityId,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setProducts(Array.isArray(resItems.data) ? resItems.data : []);

        const e = resEst.data.establishment || {};
        setEstId(e.id);
        setEstName(String(e.name || "").toUpperCase());
        setEstLogo(e.logo || "");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const openAddItemModal = () => {
    setModalMode("add");
    setModalItems(products);
    setModalIndex(null);
    setModalInitialAdditions([]);
    setModalInitialRemovals([]);
    setModalOpen(true);
  };

  const openAdditionsModal = (index) => {
    const line = orderLines[index];
    const adds = Array.isArray(line.additions) ? line.additions : [];
    const additions = products.filter(
      (p) => String(p.category || "").toLowerCase() === "adicionais"
    );

    setModalMode("additions");
    setModalIndex(index);
    setModalItems(additions);
    setModalInitialAdditions(adds);
    setModalInitialRemovals([]);
    setModalOpen(true);
  };

  const openRemovalsModal = (index) => {
    const line = orderLines[index];
    const rems = Array.isArray(line.removals) ? line.removals : [];
    const additions = products.filter(
      (p) => String(p.category || "").toLowerCase() === "adicionais"
    );

    setModalMode("removals");
    setModalIndex(index);
    setModalItems(additions);
    setModalInitialAdditions([]);
    setModalInitialRemovals(rems);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setModalIndex(null);
    setModalItems([]);
    setModalInitialAdditions([]);
    setModalInitialRemovals([]);
  };

  const handleAddItem = ({ product, quantity }) => {
    const line = {
      product,
      quantity: quantity || 1,
      additions: [],
      removals: [],
    };
    setOrderLines((prev) => [...prev, line]);
    closeModal();
  };

  const handleSaveAdditions = (index, newAdditions) => {
    setOrderLines((lines) => {
      const updated = [...lines];
      updated[index].additions = newAdditions;
      return updated;
    });
    closeModal();
  };

  const handleSaveRemovals = (index, newRemovals) => {
    setOrderLines((lines) => {
      const updated = [...lines];
      updated[index].removals = newRemovals;
      return updated;
    });
    closeModal();
  };

  const handleRemoveLine = (i) =>
    setOrderLines((lines) => lines.filter((_, idx) => idx !== i));

 const handleQuantity = (index, action) => {
  setOrderLines((prev) => {
    const updated = prev.map((line, i) => {
      if (i !== index) return line;

      let quantity = Number(line.quantity || 1);

      if (action === "inc") quantity += 1;
      if (action === "dec") quantity = Math.max(1, quantity - 1);

      return {
        ...line,
        quantity,
      };
    });

    return updated;
  });
};


  const total = useMemo(() => {
    let t = 0;
    orderLines.forEach((line) => {
      t += Number(line.quantity || 1) * Number(line.product.price || 0);
      line.additions?.forEach((a) => {
        const prod = products.find((x) => x.id === a.id);
        if (prod) t += Number(prod.price || 0) * Number(a.quantity || 1);
      });
    });
    return t;
  }, [orderLines, products]);

  const formattedTotal = `R$ ${total.toFixed(2).replace(".", ",")}`;

  const handleFormChange = (field, value) =>
    setForm((f) => ({
      ...f,
      [field]: value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderLines.length) {
      Swal.fire("Atenção", "Adicione ao menos um item.", "warning");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user || !user.id) {
      Swal.fire("Erro", "Usuário não identificado. Faça login novamente.", "error");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        mode: "direct",
        app_id: appId,
        entity_id: Number(estId),
        entity_name: "establishment",
        attendant_id: user.id,
        customer_name: form.customer_name,
        origin: form.origin,
        fulfillment: form.fulfillment,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        notes: form.notes,
        items: orderLines.map((l) => ({
          item_id: l.product.id,
          quantity: l.quantity,
          additions: l.additions || [],
          removals: l.removals || [],
        })),
      };

      await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Sucesso", "Pedido criado.", "success");

      navigate(`/order/list/${entityId}`);

    } catch (err) {
      Swal.fire("Erro", err.response?.data?.error || "Erro ao criar pedido.", "error");
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
    closeModal,
    handleAddItem,
    handleSaveAdditions,
    handleSaveRemovals,
    handleRemoveLine,
    handleQuantity,
    handleSubmit,
    handleFormChange,
  };
}

// ====================== useOrderCreate.js ======================
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";
import { useParams } from "react-router-dom";

export default function useOrderCreate() {
  const { entityId } = useParams();

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

<<<<<<< HEAD
=======
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);

  const [existingAdds, setExistingAdds] = useState([]);
  const [existingRems, setExistingRems] = useState([]);

>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const [resItems, resEst] = await Promise.all([
          axios.get(`${apiBaseUrl}/item`, {
<<<<<<< HEAD
            params: {
              entity_name: "establishment",
              entity_id: entityId,
            },
            headers: { Authorization: `Bearer ${token}` },
=======
            params: { entity_name: "establishment", entity_id: Number(entityId) },
            headers: { Authorization: `Bearer ${token}` }
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
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
<<<<<<< HEAD
=======

>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
      } catch {
        Swal.fire("Erro", "Não foi possível carregar dados.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [entityId]);

  const openAddItemModal = () => {
    setModalMode("add-item");
    setModalIndex(null);
    setModalItems(products);
<<<<<<< HEAD
    setModalInitialAdditions([]);
    setModalInitialRemovals([]);
=======
    setExistingAdds([]);
    setExistingRems([]);
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
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
<<<<<<< HEAD
    setModalInitialAdditions(adds);
    setModalInitialRemovals([]);
=======
    setExistingAdds(orderLines[index]?.additions || []);
    setExistingRems([]);
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
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
<<<<<<< HEAD
    setModalInitialAdditions([]);
    setModalInitialRemovals(rems);
=======
    setExistingAdds([]);
    setExistingRems(orderLines[index]?.removals || []);
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setModalIndex(null);
<<<<<<< HEAD
    setModalItems([]);
    setModalInitialAdditions([]);
    setModalInitialRemovals([]);
=======
    setExistingAdds([]);
    setExistingRems([]);
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
  };

  const handleAddItem = (item) => {
    const line = {
      product: item,
      quantity: 1,
      additions: [],
      removals: []
    };

    setOrderLines((prev) => [...prev, line]);
    closeModal();
  };

  const handleSaveAdditions = (index, newAdditions) => {
    setOrderLines((lines) => {
      const c = [...lines];
      c[index].additions = newAdditions;
      return c;
    });
    closeModal();
  };

  const handleSaveRemovals = (index, newRemovals) => {
    setOrderLines((lines) => {
      const c = [...lines];
      c[index].removals = newRemovals;
      return c;
    });
    closeModal();
  };

  const handleRemoveLine = (i) =>
    setOrderLines((lines) => lines.filter((_, idx) => idx !== i));

  const handleQuantity = (i, action) =>
    setOrderLines((lines) => {
      const c = [...lines];
      let q = Number(c[i].quantity || 1);

      if (action === "minus") q = Math.max(1, q - 1);
      if (action === "plus") q++;

      c[i].quantity = q;
      return c;
    });

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
<<<<<<< HEAD
          additions: l.additions || [],
          removals: l.removals || [],
        })),
=======
          additions: l.additions.flatMap((a) => Array(a.quantity).fill(a.id)),
          removals: l.removals
        }))
>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
      };

      await axios.post(`${apiBaseUrl}/order`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Sucesso", "Pedido criado.", "success");

      setOrderLines([]);
      setForm((f) => ({
        ...f,
        customer_name: "",
        notes: "",
      }));

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
<<<<<<< HEAD
    modalInitialAdditions,
    modalInitialRemovals,
=======

    existingAdds,
    existingRems,

>>>>>>> 7821e4cda2b1677cb7ba42942e24e0f09a220b65
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

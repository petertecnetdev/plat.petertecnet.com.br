import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl, appId } from "../config";
import { useNavigate, useParams } from "react-router-dom";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const apiMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.response?.data?.errors
    ? Object.values(error.response.data.errors).flat().join("\n")
    : "") ||
  fallback;

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
  const [currentUser, setCurrentUser] = useState(null);
  const [attendantId, setAttendantId] = useState(null);

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
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        if (!entityId || Number.isNaN(Number(entityId))) {
          throw new Error("Estabelecimento inválido.");
        }

        const headers = authHeaders();
        const [resEst, resItems, resMe, resEmployers] = await Promise.all([
          axios.get(`${apiBaseUrl}/establishment/show/${entityId}`, { headers }),
          axios.get(`${apiBaseUrl}/item/list-by-entity/${entityId}`, { headers }),
          axios.get(`${apiBaseUrl}/auth/me`, { headers }),
          axios.get(`${apiBaseUrl}/employer/list-by-entity/${entityId}`, { headers }),
        ]);

        if (!mounted) return;

        const establishment = resEst.data?.establishment || resEst.data;
        if (!establishment?.id) {
          throw new Error("Estabelecimento não encontrado.");
        }
        if (Number(establishment.app_id) !== Number(appId)) {
          throw new Error("Este estabelecimento não pertence à Plat.");
        }

        const items = Array.isArray(resItems.data?.items)
          ? resItems.data.items
          : Array.isArray(resItems.data)
            ? resItems.data
            : [];

        const me = resMe.data?.user || resMe.data || null;
        const employers = Array.isArray(resEmployers.data?.employers)
          ? resEmployers.data.employers
          : Array.isArray(resEmployers.data)
            ? resEmployers.data
            : [];

        const usableAttendant = employers.find(
          (employer) => Number(employer?.user_id) !== Number(me?.id)
        ) || employers[0] || null;

        setProducts(items);
        setCurrentUser(me);
        setAttendantId(usableAttendant?.id || null);
        setEstId(establishment.id);
        setEstName(String(establishment.name || "").toUpperCase());
        setEstLogo(establishment.logo || "");
      } catch (error) {
        console.error("[Plat] Falha ao carregar novo pedido", error);
        Swal.fire(
          "Erro",
          apiMessage(error, "Não foi possível carregar os dados do pedido."),
          "error"
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [entityId]);

  const openAddItemModal = () => {
    if (!products.length) {
      Swal.fire(
        "Sem itens",
        "Cadastre pelo menos um item neste estabelecimento antes de criar um pedido.",
        "info"
      );
      return;
    }
    setModalMode("add");
    setModalItems(products);
    setModalIndex(null);
    setModalInitialAdditions([]);
    setModalInitialRemovals([]);
    setModalOpen(true);
  };

  const openAdditionsModal = (index) => {
    const line = orderLines[index];
    if (!line) return;
    setModalMode("additions");
    setModalIndex(index);
    setModalItems(
      products.filter(
        (p) => String(p.category || "").toLowerCase() === "adicionais"
      )
    );
    setModalInitialAdditions(Array.isArray(line.additions) ? line.additions : []);
    setModalInitialRemovals([]);
    setModalOpen(true);
  };

  const openRemovalsModal = (index) => {
    const line = orderLines[index];
    if (!line) return;
    setModalMode("removals");
    setModalIndex(index);
    setModalItems(products);
    setModalInitialAdditions([]);
    setModalInitialRemovals(Array.isArray(line.removals) ? line.removals : []);
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
    if (!product?.id) return;
    setOrderLines((prev) => [
      ...prev,
      { product, quantity: Math.max(1, Number(quantity) || 1), additions: [], removals: [] },
    ]);
    closeModal();
  };

  const handleSaveAdditions = (index, newAdditions) => {
    setOrderLines((lines) =>
      lines.map((line, i) =>
        i === index ? { ...line, additions: newAdditions || [] } : line
      )
    );
    closeModal();
  };

  const handleSaveRemovals = (index, newRemovals) => {
    setOrderLines((lines) =>
      lines.map((line, i) =>
        i === index ? { ...line, removals: newRemovals || [] } : line
      )
    );
    closeModal();
  };

  const handleRemoveLine = (index) =>
    setOrderLines((lines) => lines.filter((_, i) => i !== index));

  const handleQuantity = (index, action) => {
    setOrderLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const current = Math.max(1, Number(line.quantity) || 1);
        return {
          ...line,
          quantity: action === "inc" ? current + 1 : Math.max(1, current - 1),
        };
      })
    );
  };

  const total = useMemo(() => {
    return orderLines.reduce((sum, line) => {
      let lineTotal = (Number(line.quantity) || 1) * Number(line.product?.price || 0);
      (line.additions || []).forEach((addition) => {
        const product = products.find(
          (item) => Number(item.id) === Number(addition.id)
        );
        if (product) {
          lineTotal += Number(product.price || 0) * (Number(addition.quantity) || 1);
        }
      });
      return sum + lineTotal;
    }, 0);
  }, [orderLines, products]);

  const formattedTotal = `R$ ${total.toFixed(2).replace(".", ",")}`;

  const handleFormChange = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event?.preventDefault?.();

    if (!estId) {
      Swal.fire("Erro", "Estabelecimento não identificado.", "error");
      return;
    }
    if (!orderLines.length) {
      Swal.fire("Atenção", "Adicione ao menos um item.", "warning");
      return;
    }
    if (!String(form.customer_name || "").trim()) {
      Swal.fire("Atenção", "Informe o nome do cliente.", "warning");
      return;
    }
    if (!attendantId) {
      Swal.fire(
        "Atendente necessário",
        "Este estabelecimento ainda não possui um colaborador disponível para registrar o pedido. Cadastre ou vincule um colaborador e tente novamente.",
        "warning"
      );
      return;
    }
    if (!currentUser?.id) {
      Swal.fire("Erro", "Sessão inválida. Entre novamente na Plat.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        mode: "direct",
        app_id: appId,
        entity_id: Number(estId),
        entity_name: "establishment",
        attendant_id: Number(attendantId),
        client_id: Number(currentUser.id),
        customer_name: String(form.customer_name).trim(),
        origin: form.origin,
        fulfillment: form.fulfillment,
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        notes: form.notes || null,
        items: orderLines.map((line) => ({
          item_id: Number(line.product.id),
          quantity: Math.max(1, Number(line.quantity) || 1),
          additions: line.additions || [],
          removals: line.removals || [],
        })),
      };

      await axios.post(`${apiBaseUrl}/order`, payload, { headers: authHeaders() });
      await Swal.fire("Sucesso", "Pedido criado com sucesso.", "success");
      navigate(`/order/list/${entityId}`);
    } catch (error) {
      console.error("[Plat] Falha ao criar pedido", error);
      Swal.fire("Erro", apiMessage(error, "Erro ao criar pedido."), "error");
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

import axios from "axios";
import { apiV1BaseUrl } from "../config";

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` });
const orderingRequests = new Map();

export const getRestaurants = async (params = {}) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments`, { params });
  return data?.data || { data: [] };
};

export const getOrdering = async (slug) => {
  const key = String(slug || "").trim();
  const cached = orderingRequests.get(key);
  if (cached && Date.now() - cached.createdAt < 5000) return cached.promise;

  const promise = axios
    .get(`${apiV1BaseUrl}/establishments/${encodeURIComponent(key)}/ordering`)
    .then(({ data }) => data?.data || {})
    .catch((error) => {
      orderingRequests.delete(key);
      throw error;
    });

  orderingRequests.set(key, { createdAt: Date.now(), promise });
  return promise;
};

export const createCheckout = async (payload) => {
  const { data } = await axios.post(`${apiV1BaseUrl}/orders`, payload, { headers: headers() });
  return data?.data || {};
};

export const getMyOrders = async () => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders`, { headers: headers() });
  return data?.data || { data: [] };
};

export const getMyOrder = async (id) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders/${id}`, { headers: headers() });
  return data?.data || null;
};

export const getMyOrderPayment = async (id) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/me/orders/${id}/payment`, { headers: headers() });
  return data?.data || null;
};

export const getEstablishmentOrders = async (establishmentId, params = {}) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${establishmentId}/orders`, { headers: headers(), params });
  return data?.data || { data: [] };
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await axios.patch(`${apiV1BaseUrl}/orders/${id}/status`, { status }, { headers: headers() });
  return data?.data || null;
};

export const getDashboardSummary = async () => {
  const { data } = await axios.get(`${apiV1BaseUrl}/dashboard`, { headers: headers() });
  return data?.data || { totals: {}, establishments: [] };
};

export const getOrderingSettings = async (establishmentId) => {
  const { data } = await axios.get(`${apiV1BaseUrl}/establishments/${establishmentId}/ordering-settings`, { headers: headers() });
  return data?.data || null;
};

export const updateOrderingSettings = async (establishmentId, payload) => {
  const { data } = await axios.patch(`${apiV1BaseUrl}/establishments/${establishmentId}/ordering-settings`, payload, { headers: headers() });
  return data?.data || null;
};

export const apiErrorMessage = (error, fallback = "Não foi possível concluir a operação.") =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join("\n") : "") ||
  error?.message ||
  fallback;

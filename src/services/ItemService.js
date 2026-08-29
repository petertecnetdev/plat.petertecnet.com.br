import axios from "axios";
import { apiBaseUrl } from "../config";

const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token() || ""}` });

const normalizeError = (error) => ({
  success: false,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Erro ao se conectar ao servidor.",
  errors: error?.response?.data?.errors || null,
  status: error?.response?.status || null,
});

const itemService = {
  store: async (formData) => {
    try {
      const { data } = await axios.post(`${apiBaseUrl}/item`, formData, {
        headers: { ...headers(), "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },

  listByEntity: async (identifier) => {
    try {
      const { data } = await axios.get(
        `${apiBaseUrl}/item/list-by-entity/${identifier}`,
        { headers: headers() }
      );
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },

  delete: async (id) => {
    try {
      const { data } = await axios.delete(`${apiBaseUrl}/item/${id}`, {
        headers: headers(),
      });
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },

  show: async (id) => {
    try {
      const { data } = await axios.get(`${apiBaseUrl}/item/${id}`, {
        headers: headers(),
      });
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },

  view: async (identifier) => {
    try {
      const { data } = await axios.get(`${apiBaseUrl}/item/view/${identifier}`, {
        headers: headers(),
      });
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },

  update: async (id, formData) => {
    try {
      // POST is intentionally supported by the API for multipart updates.
      const { data } = await axios.post(`${apiBaseUrl}/item/${id}`, formData, {
        headers: { ...headers(), "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (error) {
      return normalizeError(error);
    }
  },
};

export default itemService;

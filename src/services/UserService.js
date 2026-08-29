import axios from "axios";
import { apiBaseUrl } from "../config";

const apiServiceUrl = "user";

const userService = {
  getToken: () => localStorage.getItem("token"),

  handleError: (error, defaultMessage) => {
    console.error(error);
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      defaultMessage;
    throw new Error(message);
  },

  checkAuth: (token) => {
    if (!token) throw new Error("Usuário não autenticado.");
  },

  list: async () => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.get(`${apiBaseUrl}/${apiServiceUrl}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao obter a lista de usuários.");
    }
  },

  update: async (userId, userData) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao atualizar o usuário.");
    }
  },

  store: async (userData) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.post(
        `${apiBaseUrl}/${apiServiceUrl}/new`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao criar o usuário.");
    }
  },

  show: async (userId) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.get(
        `${apiBaseUrl}/${apiServiceUrl}/show/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao obter o perfil do usuário.");
    }
  },

  view: async (userName) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.get(
        `${apiBaseUrl}/${apiServiceUrl}/${encodeURIComponent(userName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao obter as informações do usuário.");
    }
  },

  destroy: async (userId) => {
    try {
      const token = userService.getToken();
      userService.checkAuth(token);
      const { data } = await axios.delete(
        `${apiBaseUrl}/${apiServiceUrl}/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (error) {
      userService.handleError(error, "Erro ao deletar o usuário.");
    }
  },
};

export default userService;

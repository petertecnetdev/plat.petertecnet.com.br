// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,  // deve ser "https://api.petertecnet.com.br/api"
  headers: {
    "Content-Type": "application/json",
  },
});

// opcional: injeta o Bearer token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

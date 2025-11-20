import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { apiBaseUrl } from "../config";

export default function useLogin(onSuccess, redirectTo) {
  const [loading, setLoading] = useState(false);

  const loadUserFromMe = async (token) => {
    try {
      const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("profile", JSON.stringify(data.user?.profile || {}));
      localStorage.setItem("is_employer", data.is_employer ? "1" : "0");

      return data.user;
    } catch (err) {
      console.error("Erro ao carregar /me:", err);
      throw new Error("Falha ao carregar informações do usuário.");
    }
  };

  const login = async (username, password) => {
    setLoading(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
        username,
        password
      });

      const token = data.token?.access_token || data.token || data.access_token;

      if (!token) {
        Swal.fire("Erro", "Nenhum token retornado pela API.", "error");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);

      await loadUserFromMe(token);

      Swal.fire("Sucesso", "Login realizado!", "success");

      if (onSuccess) onSuccess();
      if (redirectTo) window.location.href = redirectTo;

    } catch (err) {
      Swal.fire(
        "Erro",
        err.response?.data?.error || "Falha ao efetuar login.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
}

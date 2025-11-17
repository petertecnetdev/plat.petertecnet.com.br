import { useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

export default function useLogin(onSuccess, redirectTo) {
  const [loading, setLoading] = useState(false);

  const setToken = (token) => localStorage.setItem("token", token);

  const extractToken = (p) =>
    p.token?.access_token ??
    p.token?.original?.access_token ??
    p.access_token ??
    p.token;

  const showError = (msg) =>
    Swal.fire({
      title: "Erro",
      text: msg,
      icon: "error",
      confirmButtonText: "Ok",
      customClass: {
        popup: "custom-swal",
        title: "custom-swal-title",
        content: "custom-swal-text",
      },
    });

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        return resolve({ latitude: null, longitude: null });
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const login = async (username, password) => {
    setLoading(true);

    try {
      const location = await getLocation();

      const { data } = await api.post("/auth/login", {
        username,
        password,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("Token não recebido");

      setToken(token);
      window.dispatchEvent(new Event("authChanged"));

      if (onSuccess) onSuccess(token);
      else window.location.href = redirectTo;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Falha no login.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async (credential) => {
    setLoading(true);

    try {
      const location = await getLocation();

      const { data } = await api.post("/auth/google", {
        token_id: credential,
        ...location,
      });

      const token = extractToken(data);
      if (!token) throw new Error("Token Google não recebido");

      setToken(token);
      window.dispatchEvent(new Event("authChanged"));

      if (onSuccess) onSuccess(token);
      else window.location.href = redirectTo;
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Falha no login com Google.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    login,
    loginGoogle,
  };
}

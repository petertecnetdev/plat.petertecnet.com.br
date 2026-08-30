import { useCallback, useState } from "react";
import Swal from "sweetalert2";
import api from "../services/api";

const extractToken = (payload = {}) =>
  payload.token?.access_token ??
  payload.token?.original?.access_token ??
  payload.access_token ??
  (typeof payload.token === "string" ? payload.token : null);

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  (error?.code === "ECONNABORTED"
    ? "A conexão com o servidor demorou demais. Tente novamente."
    : fallback);

const showError = (message) =>
  Swal.fire({
    title: "Não foi possível entrar",
    text: message,
    icon: "error",
    confirmButtonText: "Ok",
    allowOutsideClick: true,
  });

const requestLocation = () => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ latitude: null, longitude: null });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      () => resolve({ latitude: null, longitude: null }),
      {
        enableHighAccuracy: false,
        timeout: 1200,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
};

export default function useLogin(onSuccess, redirectTo = "/dashboard") {
  const [loading, setLoading] = useState(false);

  const finishAuthentication = useCallback(
    (data) => {
      const token = extractToken(data);
      if (!token) {
        throw new Error("Token de autenticação não recebido pela API.");
      }

      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("authChanged"));

      if (onSuccess) onSuccess(token);
      else window.location.replace(redirectTo || "/dashboard");

      return token;
    },
    [onSuccess, redirectTo]
  );

  const execute = useCallback(
    async (request, fallbackMessage) => {
      setLoading(true);

      try {
        const { data } = await request();
        return finishAuthentication(data);
      } catch (error) {
        localStorage.removeItem("token");

        // Libera o ProcessingIndicator antes de abrir o alerta.
        setLoading(false);
        await showError(getErrorMessage(error, fallbackMessage));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [finishAuthentication]
  );

  const login = useCallback(
    async (username, password) => {
      const location = await requestLocation();
      return execute(
        () => api.post("/auth/login", { username, password, ...location }),
        "Usuário/e-mail ou senha inválidos."
      );
    },
    [execute]
  );

  const loginGoogle = useCallback(
    async (credential) => {
      if (!credential) {
        await showError("Credencial do Google não recebida.");
        return null;
      }

      const location = await requestLocation();
      return execute(
        () => api.post("/auth/google", { token_id: credential, ...location }),
        "Não foi possível entrar com o Google."
      );
    },
    [execute]
  );

  return { loading, login, loginGoogle };
}

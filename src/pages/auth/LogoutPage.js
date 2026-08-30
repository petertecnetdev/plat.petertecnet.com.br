import React, { useEffect } from "react";
import authService from "../../services/AuthService";
import LoadingComponent from "../../components/LoadingComponent";

const LogoutPage = () => {
  useEffect(() => {
    let active = true;

    const logout = async () => {
      // Remove a credencial imediatamente. Assim nenhuma tela protegida pode
      // iniciar novas requisições enquanto o logout remoto é concluído.
      const token = localStorage.getItem("token");
      localStorage.removeItem("token");

      try {
        // O serviço recebeu o token antes da remoção apenas para invalidar a
        // sessão remota; a saída local não depende da resposta da API.
        if (token) {
          await authService.logoutWithToken?.(token);
        }
      } catch (error) {
        console.warn("[Plat] Sessão remota já estava encerrada.", error);
      } finally {
        if (active) window.location.replace("/login");
      }
    };

    logout();
    return () => { active = false; };
  }, []);

  return <LoadingComponent />;
};

export default LogoutPage;

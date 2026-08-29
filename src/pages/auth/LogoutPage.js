import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/AuthService";
import LoadingComponent from "../../components/LoadingComponent";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const logout = async () => {
      try {
        await authService.logout();
      } catch (error) {
        console.error("Erro durante o logout:", error);
      } finally {
        localStorage.removeItem("token");
        if (mounted) navigate("/login", { replace: true });
      }
    };

    logout();
    return () => { mounted = false; };
  }, [navigate]);

  return <LoadingComponent />;
};

export default LogoutPage;

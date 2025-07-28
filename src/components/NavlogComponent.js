import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { storageUrl, apiBaseUrl } from "../config";
import axios from "axios";
import "./NavlogComponent.css";

export default function NavlogComponent() {
  const location = useLocation();
  const isPublicView = location.pathname.startsWith("/establishment/view");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setShowMobileMenu(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isPublicView) {
      setLoading(false);
      setLoadingMenu(false);
      return;
    }

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setLoadingMenu(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
        setUser({
          ...response.data.user,
          establishments: response.data.establishments || [],
        });
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
        setLoadingMenu(false);
      }
    })();
  }, [isPublicView]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  const handleToggleMobileMenu = () => {
    setShowMobileMenu((prev) => !prev);
    setShowAdminSubmenu(false);
  };

  const renderAdminMenu = () => (
    <>
      <button
        className="navlog__admin-btn"
        onClick={() => setShowAdminSubmenu((v) => !v)}
      >
        Administrativo {showAdminSubmenu ? "▲" : "▼"}
      </button>
      {showAdminSubmenu && (
        <div className="navlog__admin-submenu">
          <Link to="/user/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">
            Usuários
          </Link>
          <Link to="/barber/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">
            Barbeiros
          </Link>
          <Link to="/service/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">
            Serviços
          </Link>
          <Link to="/appointments/list" onClick={handleToggleMobileMenu} className="navlog__submenu-link">
            Agendamentos
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      <Navbar expand={false} sticky="top" bg="dark" variant="dark" className="navlog__navbar">
        <Navbar.Brand as={Link} to="/" className="navlog__brand">
          <img
            src="/images/logo.png"
            alt="Logo Buddys Royale"
            className="navlog__logo-image"
            draggable={false}
          />
        </Navbar.Brand>
        <div className="navlog__menu-icon">
          <button
            onClick={handleToggleMobileMenu}
            className="navlog__mobile-toggle-btn"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        </div>
      </Navbar>

      {showMobileMenu && (
        <div className="navlog__mobile-menu">
          <div className="navlog__mobile-close">
            <button
              onClick={handleToggleMobileMenu}
              className="navlog__close-btn"
              aria-label="Fechar menu"
            >
              ×
            </button>
          </div>
          <div className="navlog__mobile-content">
            {loading || loadingMenu ? (
              <p className="navlog__loading">Carregando...</p>
            ) : user ? (
              <>
                <img
                  src={user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                  alt="Avatar"
                  onError={handleImageError}
                  className="navlog__avatar"
                />
                <h5 className="navlog__user-name">{user.first_name}</h5>
                <div className="navlog__mobile-links">
                  <Link to="/user/update" onClick={handleToggleMobileMenu} className="navlog__link">
                    Gerenciar Conta
                  </Link>

                  {user.establishments?.length === 0 && (
                    <Link
                      to="/establishment/create"
                      onClick={handleToggleMobileMenu}
                      className="navlog__link"
                    >
                      Criar Estabelecimento
                    </Link>
                  )}

                  {user.profile?.name === "Administrador" && renderAdminMenu()}

                  <Link to="/logout" onClick={handleToggleMobileMenu} className="navlog__link">
                    Sair
                  </Link>
                </div>
              </>
            ) : isPublicView ? null : (
              <p className="navlog__loading">Usuário não encontrado</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

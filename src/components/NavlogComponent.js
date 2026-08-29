import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FiActivity,
  FiBriefcase,
  FiChevronDown,
  FiClipboard,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlusCircle,
  FiSettings,
  FiShoppingBag,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { storageUrl, apiBaseUrl } from "../config";
import "./NavlogComponent.css";

export default function NavlogComponent() {
  const location = useLocation();
  const isPublicView = location.pathname.startsWith("/establishment/view");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    if (isPublicView) {
      setLoading(false);
      return;
    }

    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser({
          ...data.user,
          establishments: data.establishments || [],
        });
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    })();
  }, [isPublicView]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const firstEstablishment = user?.establishments?.[0];
  const isAdmin = user?.profile?.name === "Administrador";
  const displayName = user?.first_name || user?.name || "Conta";
  const avatar = user?.avatar
    ? `${storageUrl}/${user.avatar}`
    : "/images/user.png";

  const navItems = useMemo(() => {
    const items = [
      { to: "/dashboard", label: "Visão geral", icon: FiHome },
      { to: "/establishment", label: "Estabelecimentos", icon: FiBriefcase },
    ];

    if (firstEstablishment) {
      items.push(
        {
          to: `/order/list/${firstEstablishment.id}`,
          label: "Pedidos",
          icon: FiShoppingBag,
        },
        {
          to: "/service-record/my",
          label: "Atendimentos presenciais",
          icon: FiActivity,
        },
        {
          to: `/item/list/${firstEstablishment.slug}`,
          label: "Itens",
          icon: FiClipboard,
        }
      );
    } else {
      items.push({
        to: "/service-record/my",
        label: "Atendimentos presenciais",
        icon: FiActivity,
      });
    }

    return items;
  }, [firstEstablishment]);

  const active = (to) =>
    location.pathname === to ||
    (to !== "/dashboard" && location.pathname.startsWith(to));

  if (isPublicView) {
    return (
      <header className="plat-public-nav">
        <Link to="/" className="plat-public-nav__brand" aria-label="Plat">
          <img src="/images/logo.png" alt="Plat" />
          <span>PLAT</span>
        </Link>
      </header>
    );
  }

  return (
    <>
      <button
        className="plat-mobile-trigger"
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir navegação"
      >
        <FiMenu />
      </button>

      {mobileOpen && (
        <button
          className="plat-nav-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`plat-sidebar${mobileOpen ? " plat-sidebar--open" : ""}`}>
        <div className="plat-sidebar__top">
          <Link to="/dashboard" className="plat-sidebar__brand">
            <img src="/images/logo.png" alt="Plat" />
            <div>
              <strong>PLAT</strong>
              <span>Gestão inteligente</span>
            </div>
          </Link>

          <button
            className="plat-sidebar__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar navegação"
          >
            <FiX />
          </button>
        </div>

        <nav className="plat-sidebar__nav" aria-label="Navegação principal">
          <span className="plat-sidebar__eyebrow">Operação</span>

          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`plat-sidebar__link${active(to) ? " is-active" : ""}`}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}

          <span className="plat-sidebar__eyebrow plat-sidebar__eyebrow--spaced">
            Gestão
          </span>

          <Link to="/establishment/create" className="plat-sidebar__link">
            <FiPlusCircle />
            <span>Novo estabelecimento</span>
          </Link>

          <Link
            to="/user/update"
            className={`plat-sidebar__link${active("/user/update") ? " is-active" : ""}`}
          >
            <FiSettings />
            <span>Minha conta</span>
          </Link>

          {isAdmin && (
            <div className="plat-sidebar__admin">
              <button
                className="plat-sidebar__link plat-sidebar__admin-toggle"
                onClick={() => setAdminOpen((v) => !v)}
              >
                <FiUsers />
                <span>Administrativo</span>
                <FiChevronDown className={adminOpen ? "is-rotated" : ""} />
              </button>

              {adminOpen && (
                <div className="plat-sidebar__submenu">
                  <Link to="/user/list">Usuários</Link>
                  <Link to="/profile/list">Perfis</Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="plat-sidebar__footer">
          {loading ? (
            <span className="plat-sidebar__loading">Carregando conta…</span>
          ) : user ? (
            <>
              {firstEstablishment && (
                <div className="plat-sidebar__context">
                  <span>Operação principal</span>
                  <strong>{firstEstablishment.name}</strong>
                </div>
              )}

              <div className="plat-sidebar__account">
                <img
                  src={avatar}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = "/images/user.png";
                  }}
                />
                <div>
                  <strong>{displayName}</strong>
                  <span>{user?.profile?.name || "Usuário"}</span>
                </div>
                <Link
                  to="/logout"
                  aria-label="Sair"
                  className="plat-sidebar__logout"
                >
                  <FiLogOut />
                </Link>
              </div>
            </>
          ) : (
            <Link to="/login" className="plat-sidebar__link">
              <FiUser /> Entrar
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

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
import { storageUrl, apiV1BaseUrl } from "../config";
import "./NavlogComponent.css";

const PLAT_LOGO = "/images/plat-logo.svg";

export default function NavlogComponent() {
  const location = useLocation();
  const isPublicView = location.pathname.startsWith("/establishment/view");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    if (isPublicView) { setLoading(false); return; }
    let activeRequest = true;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) { if (activeRequest) setLoading(false); return; }
      try {
        const { data: response } = await axios.get(`${apiV1BaseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } });
        const context = response?.data || {};
        const establishments = Array.isArray(context.establishments) ? context.establishments : [];
        if (activeRequest) setUser({ ...(context.user || {}), establishments });
      } catch (error) {
        if (error?.response?.status === 401) localStorage.removeItem("token");
        if (activeRequest) setUser(null);
      } finally { if (activeRequest) setLoading(false); }
    })();
    return () => { activeRequest = false; };
  }, [isPublicView]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const firstEstablishment = user?.establishments?.[0];
  const isAdmin = user?.profile?.name === "Administrador";
  const displayName = user?.first_name || user?.name || "Conta";
  const avatar = user?.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png";

  const navItems = useMemo(() => {
    const items = [
      { to: "/dashboard", label: "Visão geral", icon: FiHome },
      { to: "/my-orders", label: "Meus pedidos", icon: FiShoppingBag },
      { to: "/establishment", label: "Estabelecimentos", icon: FiBriefcase },
    ];
    if (firstEstablishment) {
      items.push(
        { to: `/order/list/${firstEstablishment.id}`, label: "Pedidos", icon: FiShoppingBag },
        { to: `/establishment/${firstEstablishment.id}/ordering-settings`, label: "Operação de pedidos", icon: FiSettings },
        { to: "/service-record/my", label: "Atendimentos presenciais", icon: FiActivity },
        { to: `/item/list/${firstEstablishment.slug}`, label: "Itens", icon: FiClipboard }
      );
    } else {
      items.push({ to: "/service-record/my", label: "Atendimentos presenciais", icon: FiActivity });
    }
    return items;
  }, [firstEstablishment]);

  const active = (to) => location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(`${to}/`));

  if (isPublicView) {
    const authenticated = Boolean(localStorage.getItem("token"));
    return <header className="plat-public-nav"><Link to="/" className="plat-public-nav__brand" aria-label="Plat - página inicial"><img src={PLAT_LOGO} alt=""/><span>PLAT</span></Link><nav className="plat-public-nav__actions" aria-label="Navegação do restaurante"><Link to="/restaurants">Restaurantes</Link>{authenticated ? <><Link to="/my-orders">Meus pedidos</Link><Link className="plat-public-nav__primary" to="/dashboard">Minha conta</Link></> : <Link className="plat-public-nav__primary" to={`/login?redirect=${encodeURIComponent(location.pathname)}`}>Entrar</Link>}</nav></header>;
  }

  return <>
    <button className="plat-mobile-trigger" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir navegação" aria-expanded={mobileOpen} aria-controls="plat-sidebar"><FiMenu/></button>
    {mobileOpen && <button type="button" className="plat-nav-backdrop" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"/>}
    <aside id="plat-sidebar" className={`plat-sidebar${mobileOpen ? " plat-sidebar--open" : ""}`} aria-label="Menu da Plat">
      <div className="plat-sidebar__top"><Link to="/dashboard" className="plat-sidebar__brand"><img src={PLAT_LOGO} alt=""/><div><strong>PLAT</strong><span>Gestão inteligente</span></div></Link><button type="button" className="plat-sidebar__close" onClick={() => setMobileOpen(false)} aria-label="Fechar navegação"><FiX/></button></div>
      <nav className="plat-sidebar__nav" aria-label="Navegação principal">
        <span className="plat-sidebar__eyebrow">Operação</span>
        {navItems.map(({to,label,icon:Icon})=><Link key={to} to={to} aria-current={active(to) ? "page" : undefined} className={`plat-sidebar__link${active(to)?" is-active":""}`}><Icon/><span>{label}</span></Link>)}
        <span className="plat-sidebar__eyebrow plat-sidebar__eyebrow--spaced">Gestão</span>
        <Link to="/establishment/create" className={`plat-sidebar__link${active("/establishment/create")?" is-active":""}`}><FiPlusCircle/><span>Novo estabelecimento</span></Link>
        <Link to="/user/update" className={`plat-sidebar__link${active("/user/update")?" is-active":""}`}><FiSettings/><span>Minha conta</span></Link>
        {isAdmin && <div className="plat-sidebar__admin"><button type="button" className="plat-sidebar__link plat-sidebar__admin-toggle" onClick={()=>setAdminOpen((value)=>!value)} aria-expanded={adminOpen} aria-controls="plat-admin-submenu"><FiUsers/><span>Administrativo</span><FiChevronDown className={adminOpen?"is-rotated":""}/></button>{adminOpen && <div id="plat-admin-submenu" className="plat-sidebar__submenu"><Link to="/user/list">Usuários</Link><Link to="/profile/list">Perfis</Link></div>}</div>}
      </nav>
      <div className="plat-sidebar__footer">{loading ? <span className="plat-sidebar__loading">Carregando conta…</span> : user ? <>{firstEstablishment && <div className="plat-sidebar__context"><span>Operação principal</span><strong>{firstEstablishment.fantasy || firstEstablishment.name}</strong></div>}<div className="plat-sidebar__account"><img src={avatar} alt="" onError={(event)=>{event.currentTarget.src="/images/user.png"}}/><div><strong>{displayName}</strong><span>{user?.profile?.name||"Usuário"}</span></div><Link to="/logout" aria-label="Sair" className="plat-sidebar__logout"><FiLogOut/></Link></div></> : <Link to="/login" className="plat-sidebar__link"><FiUser/><span>Entrar</span></Link>}</div>
    </aside>
  </>;
}

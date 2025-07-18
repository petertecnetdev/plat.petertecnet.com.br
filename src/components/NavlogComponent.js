import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "react-bootstrap";
import { storageUrl, apiBaseUrl } from "../config";
import axios from "axios";

const Navigation = () => {
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
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const response = await axios.get(`${apiBaseUrl}/auth/me`, { headers });
        const userData = response.data.user;
        setUser(userData);
      } catch {
        window.location.href = "/login";
      } finally {
        setLoading(false);
        setLoadingMenu(false);
      }
    };

    fetchUserData();
  }, []);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/user.png";
  };

  const handleToggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };


  const renderAdminMenu = () => (
    <>
      <button
        onClick={() => setShowAdminSubmenu(!showAdminSubmenu)}
        style={{ ...buttonStyle, marginTop: "15px" }}
      >
        Administrativo {showAdminSubmenu ? "▲" : "▼"}
      </button>
      {showAdminSubmenu && (
        <div style={submenuStyle}>
          <Link to="/user/list" onClick={handleToggleMobileMenu} style={linkStyle}>
            Usuários
          </Link>
          <Link to="/barber/list" onClick={handleToggleMobileMenu} style={linkStyle}>
            Barbeiros
          </Link>
          <Link to="/service/list" onClick={handleToggleMobileMenu} style={linkStyle}>
            Serviços
          </Link>
          <Link to="/appointments/list" onClick={handleToggleMobileMenu} style={linkStyle}>
            Agendamentos
          </Link>
        </div>
      )}
    </>
  );

  const buttonStyle = {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "1rem",
    textAlign: "left",
    cursor: "pointer",
    width: "100%",
  };

  const submenuStyle = {
    paddingLeft: "15px",
    marginTop: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const linkStyle = {
    color: "#fff",
    textDecoration: "none",
  };

  return (
    <>
      <Navbar expand="lg" sticky="top" bg="dark" variant="dark" className="px-3">
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 ">
          <img src="/images/logo.png" alt="Logo"  className="logo-image"/>
        </Navbar.Brand>
        <div className="ms-auto d-flex align-items-center gap-3">
          <button
            onClick={handleToggleMobileMenu}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.8rem",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>
      </Navbar>

      {showMobileMenu && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "#000",
            zIndex: 1050,
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ alignSelf: "flex-end" }}>
            <button
              onClick={handleToggleMobileMenu}
              style={{
                background: "none",
                border: "none",
                fontSize: "2rem",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            {loading || loadingMenu ? (
              <p style={{ color: "#fff" }}>Carregando...</p>
            ) : user ? (
              <>
                <img
                  src={user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png"}
                  alt="Avatar"
                  onError={handleImageError}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginBottom: "10px",
                  }}
                />
                <h5 style={{ color: "#fff" }}>{user.first_name}</h5>
                <div
                  style={{
                    marginTop: "30px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    alignItems: "center",
                  }}
                >
                  <Link to="/user/update" onClick={handleToggleMobileMenu} style={linkStyle}>
                    Gerenciar Conta
                  </Link>
                 
                  {user.profile?.name === "Administrador" && (
                    <>
                     
                      {renderAdminMenu()}
                    </>
                  )}
                  <Link to="/logout" onClick={handleToggleMobileMenu} style={linkStyle}>
                    Sair
                  </Link>
                </div>
              </>
            ) : (
              <p style={{ color: "#fff" }}>Usuário não encontrado</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;

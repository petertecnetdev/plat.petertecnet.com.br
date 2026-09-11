import React from "react";
import { Link, useLocation } from "react-router-dom";

const PUBLIC_MENU_PATH = /^\/establishment\/view\/([^/?#]+)/i;

export default function PoweredByPlatGrowth() {
  const location = useLocation();
  const match = location.pathname.match(PUBLIC_MENU_PATH);

  if (!match) return null;

  const slug = decodeURIComponent(match[1] || "").trim();
  const query = new URLSearchParams({
    source: "powered-by-plat",
    ref: slug,
    utm_source: "public_menu",
    utm_medium: "product_badge",
    utm_campaign: "powered_by_plat",
  });

  return (
    <aside
      aria-label="Criar cardápio digital com a Plat"
      style={{
        width: "min(1380px, calc(100% - 28px))",
        margin: "18px auto 110px",
        padding: "14px 16px",
        border: "1px solid rgba(239,216,157,.24)",
        borderRadius: 16,
        background: "rgba(13,17,23,.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 220, flex: "1 1 360px" }}>
        <strong style={{ display: "block", color: "#f4e4b7", fontSize: 14 }}>
          Powered by Plat
        </strong>
        <span style={{ color: "#aeb7c4", fontSize: 13 }}>
          Tem um bar, restaurante ou negócio? Crie seu cardápio digital e comece a receber pedidos online.
        </span>
      </div>
      <Link
        to={`/register?${query.toString()}`}
        style={{
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 13,
          color: "#11151b",
          background: "#efd89d",
          borderRadius: 999,
          padding: "10px 15px",
          whiteSpace: "nowrap",
        }}
      >
        Criar meu cardápio
      </Link>
    </aside>
  );
}

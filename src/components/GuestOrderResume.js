import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { readLatestGuestOrder } from "../utils/guestOrderTracking";

export default function GuestOrderResume() {
  const location = useLocation();
  const [order, setOrder] = useState(() => readLatestGuestOrder());

  useEffect(() => {
    const onCreated = (event) => setOrder(event?.detail || readLatestGuestOrder());
    window.addEventListener("plat:guest-order-created", onCreated);
    return () => window.removeEventListener("plat:guest-order-created", onCreated);
  }, []);

  if (!order?.id || location.pathname === `/pedido/${order.id}`) return null;

  return <Link
    to={`/pedido/${order.id}`}
    aria-label={`Acompanhar pedido ${order.order_number || order.id}`}
    style={{
      position:"fixed",
      right:16,
      bottom:86,
      zIndex:1080,
      display:"flex",
      alignItems:"center",
      gap:8,
      padding:"12px 16px",
      borderRadius:999,
      background:"#171717",
      color:"#fff",
      textDecoration:"none",
      boxShadow:"0 12px 30px rgba(0,0,0,.28)",
      fontWeight:800,
      border:"1px solid rgba(255,255,255,.15)",
    }}
  >
    <span aria-hidden="true">●</span>
    Pedido #{order.order_number || order.id} · acompanhar
  </Link>;
}

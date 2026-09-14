import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import itemService from "../services/ItemService";
import { getDashboardSummary, getOrderingSettings } from "../services/platCommerceApi";
import { trackTelemetryEvent } from "../telemetry";

const MAX_ESTABLISHMENTS_TO_INSPECT = 8;

const normalizeItems = (response) => {
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const activationStep = async (establishment) => {
  const slug = String(establishment?.slug || "").trim();
  const id = establishment?.id;
  if (!id || !slug) return null;

  const itemResponse = await itemService.listByEntity(slug);
  const items = itemResponse?.success === false ? null : normalizeItems(itemResponse);

  if (Array.isArray(items) && items.length === 0) {
    return {
      establishment,
      stage: "first_item",
      title: "Seu cardápio ainda está vazio",
      description: "Cadastre o primeiro item para transformar o estabelecimento em um cardápio que já pode ser divulgado.",
      label: "Cadastrar primeiro item",
      target: `/item/create/${encodeURIComponent(slug)}`,
      state: { onboarding: true, itemType: "product", source: "dashboard-resume" },
    };
  }

  if (!Array.isArray(items)) return null;

  try {
    const settings = await getOrderingSettings(id);
    const paymentMethods = Array.isArray(settings?.payment_methods) ? settings.payment_methods : [];
    const hasFulfillment = Boolean(settings?.delivery_enabled || settings?.pickup_enabled || settings?.dine_in_enabled);
    const readyToSell = Boolean(
      settings?.ordering_enabled &&
      settings?.accepting_orders &&
      paymentMethods.length > 0 &&
      hasFulfillment
    );

    if (readyToSell) return null;

    return {
      establishment,
      stage: "ordering",
      title: "Falta pouco para começar a receber pedidos",
      description: "Conclua formas de entrega, pagamento e disponibilidade. A Plat leva você direto para compartilhar o cardápio e gerar o QR Code.",
      label: "Continuar configuração para vender",
      target: `/establishment/${encodeURIComponent(String(id))}/ordering-settings`,
      state: { onboarding: true, source: "dashboard-resume" },
    };
  } catch {
    return {
      establishment,
      stage: "ordering",
      title: "Finalize sua operação de pedidos",
      description: "Revise disponibilidade, recebimento e pagamento para deixar o cardápio pronto para vender.",
      label: "Continuar configuração para vender",
      target: `/establishment/${encodeURIComponent(String(id))}/ordering-settings`,
      state: { onboarding: true, source: "dashboard-resume" },
    };
  }
};

export default function RevenueOnboardingResume({ user = null }) {
  const location = useLocation();
  const [resume, setResume] = useState(null);

  useEffect(() => {
    if (!user || location.pathname !== "/dashboard") {
      setResume(null);
      return undefined;
    }

    let active = true;
    (async () => {
      try {
        const summary = await getDashboardSummary();
        const rows = Array.isArray(summary?.establishments) ? summary.establishments : [];
        if (!rows.length) return;

        for (const row of rows.slice(0, MAX_ESTABLISHMENTS_TO_INSPECT)) {
          const next = await activationStep(row?.establishment || row);
          if (!active) return;
          if (next) {
            setResume(next);
            trackTelemetryEvent("plat_onboarding_resume_offered", {
              target: next.target,
              label: next.stage,
              metadata: {
                establishment_id: next.establishment?.id || null,
                establishment_slug: next.establishment?.slug || null,
                stage: next.stage,
                placement: "dashboard",
              },
            });
            return;
          }
        }
      } catch {
        // Dashboard must remain fully usable if the activation helper cannot be calculated.
      }
    })();

    return () => { active = false; };
  }, [location.pathname, user]);

  if (!resume || location.pathname !== "/dashboard") return null;

  const name = resume.establishment?.fantasy || resume.establishment?.name || "seu estabelecimento";
  const handleClick = () => trackTelemetryEvent("plat_onboarding_resume_clicked", {
    target: resume.target,
    label: resume.stage,
    metadata: {
      establishment_id: resume.establishment?.id || null,
      establishment_slug: resume.establishment?.slug || null,
      stage: resume.stage,
      placement: "dashboard",
    },
  });

  return (
    <aside
      aria-label="Continuar configuração para começar a vender"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 18,
        zIndex: 1040,
        margin: "0 auto",
        maxWidth: 980,
        padding: "14px 16px",
        borderRadius: 16,
        border: "1px solid rgba(239,216,157,.38)",
        background: "rgba(13,17,23,.96)",
        boxShadow: "0 18px 46px rgba(0,0,0,.34)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 420px", minWidth: 0 }}>
        <strong style={{ display: "block", color: "#f4e4b7", fontSize: 14 }}>{resume.title}</strong>
        <span style={{ display: "block", color: "#d7dde6", fontSize: 13, marginTop: 3 }}>
          {name}: {resume.description}
        </span>
      </div>
      <Link
        to={resume.target}
        state={resume.state}
        onClick={handleClick}
        style={{
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 13,
          color: "#11151b",
          background: "#efd89d",
          borderRadius: 999,
          padding: "11px 16px",
          whiteSpace: "nowrap",
        }}
      >
        {resume.label}
      </Link>
    </aside>
  );
}

RevenueOnboardingResume.propTypes = {
  user: PropTypes.object,
};

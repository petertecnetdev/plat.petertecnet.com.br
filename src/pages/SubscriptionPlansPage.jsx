import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SubscriptionPlanService from "../services/SubscriptionPlanService";
import {
  createSubscriptionIntent,
  createSubscriptionPixCheckout,
  syncSubscriptionPayment,
} from "../services/subscriptionIntent";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DEFAULT_SOURCE = "subscription_plans";
const MAX_ATTRIBUTION_LENGTH = 80;
const PENDING_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_RESUME_SOURCES = new Set(["upgrade_required", "signup_resume", "payment_recovery"]);

const normalizeAttribution = (value, fallback = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_ATTRIBUTION_LENGTH);

  return normalized || fallback;
};

const readPendingSubscription = () => {
  try {
    const pending = JSON.parse(localStorage.getItem("pending_subscription_plan") || "null");
    const selectedAt = pending?.selected_at ? Date.parse(pending.selected_at) : NaN;
    const fresh = Number.isFinite(selectedAt) && Date.now() - selectedAt <= PENDING_TTL_MS;

    if (pending?.application !== "plat" || !fresh) return null;
    if (!/^[a-z0-9_-]{1,80}$/i.test(String(pending?.plan || ""))) return null;

    return pending;
  } catch {
    return null;
  }
};

const getSubscriptionAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const source = normalizeAttribution(params.get("source"), DEFAULT_SOURCE);
  const referral = normalizeAttribution(params.get("ref") || params.get("referral"));
  const campaign = normalizeAttribution(params.get("utm_campaign"));

  return { source, referral, campaign };
};

const getResumePlan = () => {
  const params = new URLSearchParams(window.location.search);
  const plan = String(params.get("plan") || "").trim().toLowerCase();
  const resume = params.get("resume") === "1";
  const source = normalizeAttribution(params.get("source"));

  if (resume && AUTO_RESUME_SOURCES.has(source) && /^[a-z0-9_-]{1,80}$/i.test(plan)) {
    return plan;
  }

  const pending = readPendingSubscription();
  if (!pending?.intent_id) return "";

  return String(pending.plan).trim().toLowerCase();
};

export default function SubscriptionPlansPage() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const autoCheckoutStartedRef = useRef(false);

  useEffect(() => {
    let active = true;
    SubscriptionPlanService.list()
      .then((data) => active && setCatalog(data))
      .catch(() => active && setError("Não foi possível carregar os planos agora."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const plans = useMemo(() => catalog?.plans ?? [], [catalog]);

  const choosePlan = useCallback(async (plan) => {
    if (submittingPlan) return;

    const planCode = String(plan?.code || "").trim();
    if (!/^[a-z0-9_-]{1,80}$/i.test(planCode)) return;

    setError("");
    setPaymentMessage("");
    setSubmittingPlan(planCode);

    try {
      const priceCents = Number.isFinite(Number(plan?.price_cents))
        ? Number(plan.price_cents)
        : Number.isFinite(Number(plan?.price))
          ? Math.round(Number(plan.price) * 100)
          : null;
      const currency = plan?.currency || "BRL";
      const attribution = getSubscriptionAttribution();
      const existingPending = readPendingSubscription();
      const reusableIntentId = existingPending?.plan === planCode && existingPending?.intent_id
        ? String(existingPending.intent_id)
        : "";
      const pendingPlan = {
        application: "plat",
        plan: planCode,
        price_cents: priceCents,
        currency,
        selected_at: existingPending?.plan === planCode && existingPending?.selected_at
          ? existingPending.selected_at
          : new Date().toISOString(),
        source: reusableIntentId
          ? existingPending.source || attribution.source
          : attribution.source,
        referral: existingPending?.referral || attribution.referral || undefined,
        campaign: existingPending?.campaign || attribution.campaign || undefined,
        handoff: "app",
        ...(reusableIntentId
          ? {
              intent_id: reusableIntentId,
              intent_status: existingPending.intent_status,
            }
          : {}),
      };

      localStorage.setItem("pending_subscription_plan", JSON.stringify(pendingPlan));

      if (!localStorage.getItem("token")) {
        window.location.assign(`/register?plan=${encodeURIComponent(planCode)}`);
        return;
      }

      let intent = reusableIntentId
        ? {
            id: reusableIntentId,
            status: existingPending?.intent_status,
            price_cents: existingPending?.price_cents ?? priceCents,
            currency: existingPending?.currency || currency,
            plan_name: plan.name,
          }
        : null;

      if (!intent) {
        intent = await createSubscriptionIntent({
          planCode,
          priceCents,
          currency,
          source: pendingPlan.source,
          referral: pendingPlan.referral,
          campaign: pendingPlan.campaign,
          handoff: pendingPlan.handoff,
          page: window.location.pathname,
        });
      }

      if (!intent?.id) {
        setError("Não foi possível iniciar a contratação agora. Tente novamente.");
        return;
      }

      localStorage.setItem(
        "pending_subscription_plan",
        JSON.stringify({
          ...pendingPlan,
          intent_id: intent.id,
          intent_status: intent.status,
          price_cents: intent.price_cents ?? priceCents,
          currency: intent.currency || currency,
        })
      );

      const paymentCheckout = await createSubscriptionPixCheckout(intent.id);
      if (!paymentCheckout?.payment?.pix?.qr_code) {
        setError("Não foi possível recuperar ou gerar o PIX agora. Nenhuma cobrança foi confirmada; tente novamente.");
        return;
      }

      setCheckout({ ...paymentCheckout, planName: intent.plan_name || plan.name });
    } catch {
      setError("Não foi possível iniciar o checkout agora. Tente novamente.");
    } finally {
      setSubmittingPlan("");
    }
  }, [submittingPlan]);

  useEffect(() => {
    if (loading || error || checkout || submittingPlan || autoCheckoutStartedRef.current) return;
    if (!localStorage.getItem("token")) return;

    const resumePlanCode = getResumePlan();
    if (!resumePlanCode) return;

    const resumePlan = plans.find(
      (plan) => String(plan?.code || "").trim().toLowerCase() === resumePlanCode
    );
    if (!resumePlan) return;

    autoCheckoutStartedRef.current = true;
    choosePlan(resumePlan);
  }, [loading, error, checkout, submittingPlan, plans, choosePlan]);

  const copyPix = async () => {
    const code = checkout?.payment?.pix?.qr_code;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const confirmPayment = async () => {
    const intentId = checkout?.intent?.id;
    if (!intentId || confirmingPayment) return;

    setConfirmingPayment(true);
    setPaymentMessage("Confirmando pagamento…");
    const status = await syncSubscriptionPayment(intentId);
    const active = status?.subscription?.status === "active" && status?.entitlement?.status === "active";

    if (active) {
      localStorage.removeItem("pending_subscription_plan");
      setPaymentMessage("Pagamento confirmado. Seu plano está ativo.");
      window.location.assign("/dashboard?subscription=active");
      return;
    }

    setPaymentMessage("O PIX ainda não foi confirmado. Se você acabou de pagar, tente novamente em alguns segundos.");
    setConfirmingPayment(false);
  };

  const qrCodeBase64 = checkout?.payment?.pix?.qr_code_base64;

  return (
    <main className="container py-5">
      <div className="text-center mx-auto mb-5" style={{ maxWidth: 760 }}>
        <span className="badge text-bg-primary mb-3">Plat</span>
        <h1 className="display-6 fw-bold">Planos para bares e restaurantes</h1>
        <p className="lead text-body-secondary mb-0">
          Cardápio, pedidos, comandas, equipe e gestão em uma única operação. Valores mensais fornecidos pela Peter Tecnet API.
        </p>
      </div>

      {loading && <div className="text-center py-5">Carregando planos…</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {checkout && (
        <section className="card shadow-sm border-primary mx-auto mb-5" style={{ maxWidth: 620 }}>
          <div className="card-body p-4 p-md-5 text-center">
            <span className="badge text-bg-success mb-3">Checkout seguro</span>
            <h2 className="h3 fw-bold">Pague seu plano {checkout.planName} por PIX</h2>
            <p className="text-body-secondary">
              A liberação é automática após a confirmação do pagamento.
            </p>
            {qrCodeBase64 && (
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX da assinatura Plat"
                className="img-fluid border rounded p-2 bg-white my-3"
                style={{ width: 260, height: 260, objectFit: "contain" }}
              />
            )}
            <div className="d-grid gap-2 mt-3">
              <button type="button" className="btn btn-outline-primary" onClick={copyPix}>
                {copied ? "Código PIX copiado" : "Copiar código PIX"}
              </button>
              <button type="button" className="btn btn-success" disabled={confirmingPayment} onClick={confirmPayment}>
                {confirmingPayment ? "Confirmando…" : "Já paguei — confirmar agora"}
              </button>
            </div>
            {paymentMessage && <p className="small mt-3 mb-0">{paymentMessage}</p>}
          </div>
        </section>
      )}

      {!loading && !error && !checkout && (
        <div className="row g-4 justify-content-center">
          {plans.map((plan) => (
            <div className="col-12 col-md-6 col-xl-4" key={plan.id || plan.code}>
              <section className={`card h-100 shadow-sm border-${plan.recommended ? "primary" : "secondary-subtle"}`}>
                <div className="card-body d-flex flex-column p-4">
                  {plan.recommended && <span className="badge text-bg-primary align-self-start mb-3">Mais escolhido</span>}
                  <h2 className="h4 fw-bold">{plan.name}</h2>
                  <div className="d-flex align-items-end gap-2 my-3">
                    <strong className="display-6">{money.format(plan.price ?? plan.price_cents / 100)}</strong>
                    <span className="text-body-secondary mb-2">/mês</span>
                  </div>
                  <ul className="list-unstyled d-grid gap-2 mb-4">
                    {(plan.features || []).map((feature) => <li key={feature}>✓ {feature}</li>)}
                  </ul>
                  <button
                    type="button"
                    className={`btn btn-${plan.recommended ? "primary" : "outline-primary"} mt-auto`}
                    disabled={Boolean(submittingPlan)}
                    onClick={() => choosePlan(plan)}
                  >
                    {submittingPlan === plan.code ? "Gerando PIX…" : `Assinar ${plan.name} com PIX`}
                  </button>
                </div>
              </section>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

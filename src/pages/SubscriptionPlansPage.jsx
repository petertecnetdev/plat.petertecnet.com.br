import React, { useEffect, useMemo, useState } from "react";
import SubscriptionPlanService from "../services/SubscriptionPlanService";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function SubscriptionPlansPage() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    SubscriptionPlanService.list()
      .then((data) => active && setCatalog(data))
      .catch(() => active && setError("Não foi possível carregar os planos agora."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const plans = useMemo(() => catalog?.plans ?? [], [catalog]);

  const choosePlan = (plan) => {
    localStorage.setItem(
      "pending_subscription_plan",
      JSON.stringify({ application: "plat", plan: plan.code, selected_at: new Date().toISOString() })
    );
    const target = localStorage.getItem("token")
      ? `/dashboard?plan=${encodeURIComponent(plan.code)}`
      : `/register?plan=${encodeURIComponent(plan.code)}`;
    window.location.assign(target);
  };

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

      {!loading && !error && (
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
                    onClick={() => choosePlan(plan)}
                  >
                    Escolher {plan.name}
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

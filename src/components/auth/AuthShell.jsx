import React from "react";
import PropTypes from "prop-types";
import "../../pages/auth/Auth.css";

export default function AuthShell({ eyebrow, title, description, children, footer, compact = false }) {
  return (
    <main className="plat-auth">
      <div className="plat-auth__ambient plat-auth__ambient--gold" aria-hidden="true" />
      <div className="plat-auth__ambient plat-auth__ambient--blue" aria-hidden="true" />

      <section className={`plat-auth__panel${compact ? " plat-auth__panel--compact" : ""}`}>
        <aside className="plat-auth__brand-panel">
          <div className="plat-auth__brand">
            <div className="plat-auth__logo-wrap">
              <img src="/images/logo.png" alt="Plat" className="plat-auth__logo" />
            </div>
            <div>
              <strong>PLAT</strong>
              <span>por Peter Tecnet</span>
            </div>
          </div>

          <div className="plat-auth__brand-copy">
            <span className="plat-auth__brand-kicker">Gestão conectada</span>
            <h2>Seu negócio em uma operação mais simples.</h2>
            <p>
              Acesse estabelecimentos, itens, pedidos, atendimentos e indicadores em uma experiência única.
            </p>
          </div>

          <div className="plat-auth__brand-footer">
            <span className="plat-auth__status-dot" />
            Ambiente seguro Peter Tecnet
          </div>
        </aside>

        <div className="plat-auth__content">
          <div className="plat-auth__mobile-brand">
            <img src="/images/logo.png" alt="Plat" />
            <div><strong>PLAT</strong><span>Peter Tecnet</span></div>
          </div>

          <header className="plat-auth__header">
            {eyebrow && <span className="plat-auth__eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </header>

          <div className="plat-auth__body">{children}</div>
          {footer && <footer className="plat-auth__footer">{footer}</footer>}
        </div>
      </section>
    </main>
  );
}

AuthShell.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  compact: PropTypes.bool,
};

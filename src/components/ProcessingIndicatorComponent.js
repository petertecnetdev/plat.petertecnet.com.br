import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

const DEFAULT_MESSAGES = [
  "Preparando sua operação…",
  "Sincronizando pedidos e atendimentos…",
  "Organizando dados para a próxima tela…",
  "Quase lá — sua operação está chegando.",
];

export default function ProcessingIndicatorComponent({
  messages = DEFAULT_MESSAGES,
  interval = 2600,
  logoSrc = "/images/logo.png",
  compact = false,
}) {
  const safeMessages = useMemo(
    () => (Array.isArray(messages) && messages.filter(Boolean).length ? messages.filter(Boolean) : DEFAULT_MESSAGES),
    [messages],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (safeMessages.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeMessages.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [interval, safeMessages]);

  const currentMessage = safeMessages[index] || safeMessages[0] || "Carregando…";

  return (
    <div
      className={`plat-processing${compact ? " plat-processing--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={currentMessage}
    >
      <div className="plat-processing__ambient" aria-hidden="true">
        <i className="plat-processing__spark plat-processing__spark--one" />
        <i className="plat-processing__spark plat-processing__spark--two" />
        <i className="plat-processing__spark plat-processing__spark--three" />
      </div>

      <div className="plat-processing__card">
        <div className="plat-processing__loader" aria-hidden="true">
          <div className="plat-processing__orbit plat-processing__orbit--outer" />
          <div className="plat-processing__orbit plat-processing__orbit--inner" />
          <span className="plat-processing__pulse" />
          <div className="plat-processing__logo-shell">
            <img src={logoSrc} alt="" className="plat-processing__logo" draggable={false} />
          </div>
        </div>

        <div className="plat-processing__copy">
          <span className="plat-processing__kicker">Peter Tecnet</span>
          <strong>PLAT</strong>
          <span className="plat-processing__message" key={currentMessage}>{currentMessage}</span>
        </div>

        <div className="plat-processing__progress" aria-hidden="true"><span /></div>
        <div className="plat-processing__beat" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>
    </div>
  );
}

ProcessingIndicatorComponent.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.number,
  logoSrc: PropTypes.string,
  compact: PropTypes.bool,
};

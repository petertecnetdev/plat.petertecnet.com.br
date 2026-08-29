import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./ProcessingIndicatorComponent.css";

export default function ProcessingIndicatorComponent({
  messages = ["Carregando a Plat…", "Preparando sua operação…"],
  interval = 2200,
  logoSrc = "/images/logo.png",
  compact = false,
}) {
  const messageIndex = useRef(0);
  const [currentMessage, setCurrentMessage] = useState(messages[0] || "Carregando…");

  useEffect(() => {
    if (!messages?.length || messages.length === 1) return undefined;

    const timer = window.setInterval(() => {
      messageIndex.current = (messageIndex.current + 1) % messages.length;
      setCurrentMessage(messages[messageIndex.current]);
    }, interval);

    return () => window.clearInterval(timer);
  }, [messages, interval]);

  return (
    <div
      className={`plat-processing${compact ? " plat-processing--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="plat-processing__loader" aria-hidden="true">
        <div className="plat-processing__orbit plat-processing__orbit--outer" />
        <div className="plat-processing__orbit plat-processing__orbit--inner" />
        <span className="plat-processing__pulse" />
        <div className="plat-processing__logo-shell">
          <img src={logoSrc} alt="" className="plat-processing__logo" draggable={false} />
        </div>
      </div>

      <div className="plat-processing__copy">
        <strong>PLAT</strong>
        <span>{currentMessage}</span>
        <div className="plat-processing__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
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

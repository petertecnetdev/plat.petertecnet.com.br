import React from "react";
import PropTypes from "prop-types";
import "./AppErrorBoundary.css";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== "production") console.error("[Plat] Erro de renderização", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="plat-fatal-error" role="alert">
      <div className="plat-fatal-error__card">
        <img src="/images/plat-logo.svg" alt=""/>
        <span>PLAT</span>
        <h1>Não foi possível exibir esta tela.</h1>
        <p>Seu pedido ou cadastro não foi apagado. Recarregue a Plat para tentar novamente.</p>
        <button type="button" onClick={() => window.location.reload()}>Recarregar a Plat</button>
        <a href="/">Voltar ao início</a>
      </div>
    </main>;
  }
}

AppErrorBoundary.propTypes = { children: PropTypes.node.isRequired };

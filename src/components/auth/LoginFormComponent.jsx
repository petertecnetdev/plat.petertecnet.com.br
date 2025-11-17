import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import PropTypes from "prop-types";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import useLogin from "../../hooks/useLogin";
import "./LoginFormComponent.css";

export default function LoginFormComponent({ onSuccess, redirectTo }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { loading, login, loginGoogle } = useLogin(onSuccess, redirectTo);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  const handleGoogleSuccess = ({ credential }) => {
    loginGoogle(credential);
  };

  return (
    <>
      {loading && (
        <ProcessingIndicatorComponent
          messages={["Autenticando...", "Aguarde..."]}
        />
      )}

      {!loading && (
        <Form onSubmit={handleSubmit} className="login-form-component mt-4">
          <Form.Control
            type="text"
            placeholder="Usuário ou e-mail"
            className="neon-input mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <Form.Control
            type="password"
            placeholder="Senha"
            className="neon-input mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="neon-button w-100 mb-3">
            Entrar
          </Button>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => loginGoogle(null)}
            render={(renderProps) => (
              <Button
                onClick={renderProps.onClick}
                disabled={renderProps.disabled}
                className="google-button w-100 mb-3"
              >
                Continuar com Google
              </Button>
            )}
          />

          <div className="login-links">
            <a href="/register">Registrar-se</a>
            <span className="sep">|</span>
            <a href="/password-email">Recuperar senha</a>
          </div>
        </Form>
      )}
    </>
  );
}

LoginFormComponent.propTypes = {
  onSuccess: PropTypes.func,
  redirectTo: PropTypes.string,
};

LoginFormComponent.defaultProps = {
  redirectTo: "/",
};

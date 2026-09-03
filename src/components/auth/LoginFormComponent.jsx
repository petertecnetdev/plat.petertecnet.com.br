import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import ProcessingIndicatorComponent from "../ProcessingIndicatorComponent";
import useLogin from "../../hooks/useLogin";
import "./LoginFormComponent.css";

export default function LoginFormComponent({ onSuccess, redirectTo }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { loading, login, loginGoogle } = useLogin(onSuccess, redirectTo);

  const handleSubmit = (event) => {
    event.preventDefault();
    login(username.trim(), password);
  };

  const handleGoogleSuccess = ({ credential }) => loginGoogle(credential);

  return (
    <>
      {loading && <ProcessingIndicatorComponent messages={["Autenticando...", "Aguarde..."]} />}
      {!loading && (
        <Form onSubmit={handleSubmit} className="login-form-component mt-4">
          <Form.Label htmlFor="plat-login-identifier" className="visually-hidden">E-mail, CPF, usuário ou telefone</Form.Label>
          <Form.Control
            id="plat-login-identifier"
            type="text"
            placeholder="E-mail, CPF, usuário ou telefone"
            aria-label="E-mail, CPF, usuário ou telefone"
            autoComplete="username"
            className="neon-input mb-3"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />

          <Form.Label htmlFor="plat-login-password" className="visually-hidden">Senha</Form.Label>
          <div className="plat-password-field mb-4">
            <Form.Control
              id="plat-login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              aria-label="Senha"
              autoComplete="current-password"
              className="neon-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="plat-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <Button type="submit" className="neon-button w-100 mb-3">Entrar</Button>

          <div className="plat-google-login" aria-label="Login com Google">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => loginGoogle(null)} useOneTap={false}/>
          </div>

          <div className="login-links">
            <Link to="/register">Registrar-se</Link>
            <span className="sep" aria-hidden="true">|</span>
            <Link to="/password-email">Recuperar senha</Link>
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

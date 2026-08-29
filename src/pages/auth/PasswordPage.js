import React, { useEffect, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import authService from "../../services/AuthService";
import AuthShell from "../../components/auth/AuthShell";

const PasswordPage = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!showAlert) return undefined;
    const timer = setTimeout(() => setShowAlert(false), 5000);
    return () => clearTimeout(timer);
  }, [showAlert]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      await authService.changePassword(
        formData.current_password,
        formData.new_password,
        formData.confirm_password
      );
      setFormData({ current_password: "", new_password: "", confirm_password: "" });
      setAlertType("success");
      setAlertMessage("Senha atualizada com sucesso!");
      setShowAlert(true);
    } catch (error) {
      setAlertType("danger");
      setAlertMessage(error.response?.data?.error || error.response?.data?.message || "Ocorreu um erro ao atualizar a senha.");
      setShowAlert(true);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  return (
    <AuthShell
      compact
      eyebrow="Segurança da conta"
      title="Alterar senha"
      description="Atualize sua senha de acesso. Use uma combinação segura e diferente das senhas que você utiliza em outros serviços."
      footer={<p><Link to="/profile">Voltar para minha conta</Link></p>}
    >
      <Form onSubmit={handleFormSubmit} className="form-container">
        <Form.Group className="form-group">
          <Form.Label>Senha atual</Form.Label>
          <Form.Control
            type="password"
            placeholder="Digite sua senha atual"
            name="current_password"
            value={formData.current_password}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Form.Group className="form-group">
          <Form.Label>Nova senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Digite sua nova senha"
            name="new_password"
            value={formData.new_password}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Form.Group className="form-group">
          <Form.Label>Confirme a nova senha</Form.Label>
          <Form.Control
            type="password"
            placeholder="Repita sua nova senha"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleInputChange}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">Salvar nova senha</Button>
      </Form>

      <Alert
        show={showAlert}
        variant={alertType}
        onClose={() => setShowAlert(false)}
        dismissible
      >
        {alertMessage}
      </Alert>
    </AuthShell>
  );
};

export default PasswordPage;

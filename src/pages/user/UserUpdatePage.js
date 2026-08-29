import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { FiCamera, FiMail, FiSave, FiUser } from "react-icons/fi";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import { apiBaseUrl, storageUrl } from "../../config";
import "./User.css";

const initialUser = {
  avatar: null,
  first_name: "",
  user_name: "",
  last_name: "",
  cpf: "",
  address: "",
  phone: "",
  city: "",
  uf: "",
  postal_code: "",
  birthdate: "",
  gender: "",
  occupation: "",
  about: "",
  email: "",
};

export default function UserUpdatePage() {
  const [processing, setProcessing] = useState(false);
  const [userData, setUserData] = useState(initialUser);
  const [originalData, setOriginalData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    (async () => {
      setProcessing(true);
      try {
        const { data } = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const user = data.user || {};
        const normalized = Object.fromEntries(
          Object.keys(initialUser).map((key) => [key, user[key] ?? initialUser[key]])
        );
        setUserData(normalized);
        setOriginalData(user);
        setAvatarPreview(user.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png");
      } catch {
        Swal.fire("Erro", "Não foi possível carregar os dados da conta.", "error");
      } finally {
        setProcessing(false);
      }
    })();
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setUserData((current) => ({ ...current, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file?.type?.startsWith("image/")) {
      Swal.fire("Imagem inválida", "Selecione uma imagem válida.", "error");
      return;
    }
    setUserData((current) => ({ ...current, avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    const formData = new FormData();
    if (userData.avatar instanceof File) formData.append("avatar", userData.avatar);
    Object.entries(userData).forEach(([key, value]) => {
      if (key !== "avatar" && value !== originalData[key]) formData.append(key, value ?? "");
    });

    try {
      await axios.post(`${apiBaseUrl}/user/${originalData.id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      await Swal.fire("Conta atualizada", "Suas informações foram salvas.", "success");
      window.location.reload();
    } catch (error) {
      const validation = error.response?.data?.errors;
      const message = validation
        ? Object.values(validation).flat().join("\n")
        : error.response?.data?.message || "Não foi possível atualizar sua conta.";
      Swal.fire("Erro", message, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="account-root">
      <NavlogComponent />
      {processing && <ProcessingIndicatorComponent messages={["Atualizando sua conta…"]} />}

      <main className="account-page">
        <header className="account-header">
          <div><span>Conta</span><h1>Meu perfil</h1><p>Gerencie suas informações pessoais e de acesso.</p></div>
        </header>

        <form className="account-layout" onSubmit={submit}>
          <aside className="account-profile-card">
            <div className="account-avatar-shell">
              <img src={avatarPreview || "/images/user.png"} alt="Avatar" onError={(e) => { e.currentTarget.src = "/images/user.png"; }} />
              <label htmlFor="avatarInput" className="account-avatar-action"><FiCamera /></label>
              <input id="avatarInput" type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            </div>
            <h2>{userData.first_name || "Usuário"} {userData.last_name}</h2>
            <p>@{userData.user_name || "usuario"}</p>
            <div className="account-readonly"><FiMail /><span>{userData.email}</span></div>
          </aside>

          <section className="account-form-card">
            <div className="account-section-heading"><FiUser /><div><h2>Informações pessoais</h2><p>Dados usados na sua conta Plat.</p></div></div>
            <div className="account-grid">
              <label>Nome<Form.Control name="first_name" value={userData.first_name} onChange={change} /></label>
              <label>Sobrenome<Form.Control name="last_name" value={userData.last_name} onChange={change} /></label>
              <label>CPF<Form.Control name="cpf" value={userData.cpf} onChange={change} /></label>
              <label>Nascimento<Form.Control type="date" name="birthdate" value={userData.birthdate || ""} onChange={change} /></label>
              <label>Telefone<Form.Control name="phone" value={userData.phone} onChange={change} /></label>
              <label>Gênero<Form.Select name="gender" value={userData.gender} onChange={change}><option value="">Selecione</option><option value="male">Masculino</option><option value="female">Feminino</option><option value="other">Outro</option></Form.Select></label>
              <label className="account-span-2">Endereço<Form.Control name="address" value={userData.address} onChange={change} /></label>
              <label>Cidade<Form.Control name="city" value={userData.city} onChange={change} /></label>
              <label>UF<Form.Control name="uf" maxLength={2} value={userData.uf} onChange={change} /></label>
              <label>CEP<Form.Control name="postal_code" value={userData.postal_code} onChange={change} /></label>
              <label>Ocupação<Form.Control name="occupation" value={userData.occupation} onChange={change} /></label>
              <label className="account-span-2">Sobre você<Form.Control as="textarea" rows={4} name="about" value={userData.about} onChange={change} /></label>
            </div>
            <div className="account-actions"><button type="submit"><FiSave /> Salvar alterações</button></div>
          </section>
        </form>
      </main>
    </div>
  );
}

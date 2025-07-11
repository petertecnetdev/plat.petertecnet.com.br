import React, { useState, useEffect } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl, storageUrl } from "../../config";

const UserUpdatePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState({
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
    is_barber: false,
    email: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsProcessing(true);
        const response = await axios.get(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = response.data.user;
        setUserData({
          avatar: data.avatar || null,
          first_name: data.first_name || "",
          user_name: data.user_name || "",
          last_name: data.last_name || "",
          cpf: data.cpf || "",
          address: data.address || "",
          phone: data.phone || "",
          city: data.city || "",
          uf: data.uf || "",
          postal_code: data.postal_code || "",
          birthdate: data.birthdate || "",
          gender: data.gender || "",
          occupation: data.occupation || "",
          about: data.about || "",
          is_barber: data.is_barber === "1" || data.is_barber === 1 || data.is_barber === true,
          email: data.email || "",
        });
        setOriginalData(data);
        setAvatarPreview(data.avatar ? `${storageUrl}/${data.avatar}` : null);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        Swal.fire({
          title: "Sem dados",
          text: "Não conseguimos carregar seus dados. Tente novamente",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } finally {
        setIsProcessing(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setUserData((prevData) => ({ ...prevData, avatar: file }));
      };
      reader.readAsDataURL(file);
    } else {
      Swal.fire({
        title: "Formato Inválido",
        text: "Selecione uma imagem válida.",
        icon: "error",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setMessages(["Atualizando dados do usuário..."]);

    const formData = new FormData();

    // Se o usuário selecionou um novo avatar, envia o arquivo diretamente
    if (userData.avatar && userData.avatar instanceof File) {
      formData.append("avatar", userData.avatar);
    }

    // Lista de campos que são booleanos e precisam ser enviados como "1" ou "0"
    const booleanFields = ["is_barber"];

    // Adiciona campos alterados
    Object.keys(userData).forEach((key) => {
      if (key === "avatar") return;
      // Verifica se houve alteração comparado aos dados originais
      if (userData[key] !== originalData[key]) {
        let value = userData[key];
        if (booleanFields.includes(key)) {
          // Converte boolean para string "1" ou "0"
          value = value ? "1" : "0";
        }
        formData.append(key, value);
      }
    });

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      const response = await axios.post(
        `${apiBaseUrl}/user/${originalData.id}`,
        formData,
        { headers }
      );
      console.log(response);

      Swal.fire({
        title: "Sucesso!",
        text: "Dados do usuário atualizados com sucesso.",
        icon: "success",
        confirmButtonText: "OK",
        customClass: {
          popup: "custom-swal",
          title: "custom-swal-title",
          content: "custom-swal-text",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        const errorMessage = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        Swal.fire({
          title: "Erro de Validação",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Não foi possível atualizar os dados do usuário.",
          icon: "error",
          confirmButtonText: "OK",
          customClass: {
            popup: "custom-swal",
            title: "custom-swal-title",
            content: "custom-swal-text",
          },
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAvatarError = (e) => {
    if (e.target.src.includes("/images/user.png")) return;
    e.target.src = "/images/user.png";
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Atualizar meu perfil</p>
      <Container className="main-container" fluid>
        {isProcessing ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <Card className="card-container">
            <p className="page-header">Atualizar meus dados</p>
            <Card.Body className="card-body">
              <div className="avatar-container">
                <label htmlFor="avatarInput">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview da avatar"
                      className="avatar-preview"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <img
                      src="/images/user.png"
                      alt="Preview da avatar"
                      className="avatar-preview"
                      onError={handleAvatarError}
                    />
                  )}
                </label>
                <Button
                  variant="secondary"
                  className="change-avatar-btn"
                  onClick={() =>
                    document.getElementById("avatarInput").click()
                  }
                >
                  Alterar Avatar
                </Button>
                <Form.Control
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>
              <Form className="form-container" onSubmit={handleSubmit}>
                <Row>
                  <Col md={2}>
                    <Form.Group controlId="first_name" className="form-group">
                      <Form.Label>Primeiro Nome</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={userData.first_name}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="last_name" className="form-group">
                      <Form.Label>Sobrenome</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={userData.last_name}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="user_name" className="form-group">
                      <Form.Label>Nome de Usuário</Form.Label>
                      <p className="text-white">{userData.user_name}</p>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="email" className="form-group">
                      <Form.Label>Email</Form.Label>
                      <p className="text-white">{userData.email}</p>
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="cpf" className="form-group">
                      <Form.Label>CPF</Form.Label>
                      <Form.Control
                        type="text"
                        name="cpf"
                        value={userData.cpf}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="birthdate" className="form-group">
                      <Form.Label>Data de Nascimento</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthdate"
                        value={userData.birthdate}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="phone" className="form-group">
                      <Form.Label>Telefone (whatsapp)</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={userData.phone}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="gender" className="form-group">
                      <Form.Label>Gênero</Form.Label>
                      <Form.Select
                        name="gender"
                        value={userData.gender}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Selecione</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group controlId="address" className="form-group">
                      <Form.Label>Endereço</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="city" className="form-group">
                      <Form.Label>Cidade</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={userData.city}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group controlId="uf" className="form-group">
                      <Form.Label>Estado (UF)</Form.Label>
                      <Form.Select
                        name="uf"
                        value={userData.uf}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group controlId="postal_code" className="form-group">
                      <Form.Label>CEP</Form.Label>
                      <Form.Control
                        type="text"
                        name="postal_code"
                        value={userData.postal_code}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group controlId="occupation" className="form-group">
                      <Form.Label>Ocupação</Form.Label>
                      <Form.Control
                        type="text"
                        name="occupation"
                        value={userData.occupation}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group controlId="about" className="form-group">
                      <Form.Label>Fale sobre você</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="about"
                        value={userData.about}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="center text-center">
                  <Button variant="primary" type="submit" className="submit-btn">
                    Atualizar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
};

export default UserUpdatePage;

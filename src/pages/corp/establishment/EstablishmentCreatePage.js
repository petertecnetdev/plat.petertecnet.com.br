import React, { useState } from "react";
import { Form, Button, Container, Row, Card, Col } from "react-bootstrap";
import NavlogComponent from "../../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../../components/ProcessingIndicatorComponent";
import Swal from "sweetalert2";
import axios from "axios";
import { apiBaseUrl } from "../../../config";

const BarbershopCreatePage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [barbershopData, setBarbershopData] = useState({
    logo: null,
    name: "",
    email: "",
    address: "",
    city: "",
    description: "",
    phone: "",
    state: "",
    zipcode: "",
    website: "",
    facebook: "",
    instagram: "",
    location: "",
  });

  const [logoPreview, setLogoPreview] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBarbershopData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (file, setPreview, width, height) => {
    const reader = new FileReader();

    if (!file || !file.type.startsWith("image/")) {
      Swal.fire({
        title: "Formato de imagem inválido",
        text: "Por favor, selecione uma imagem.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataURL = canvas.toDataURL("image/png");
        setPreview(resizedDataURL);
      };
    };

    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    handleImageChange(file, setLogoPreview, 150, 150);
    setBarbershopData((prevData) => ({
      ...prevData,
      logo: file,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsProcessing(true);
    setMessages(["Aguarde enquanto cadastramos sua barbearia..."]);

    const formData = new FormData();

    if (logoPreview) {
      try {
        const logoBlob = await fetch(logoPreview).then((res) => res.blob());
        formData.append("logo", logoBlob, "logo.png");
      } catch (err) {
        console.error("Erro ao converter a imagem da logo:", err);
      }
    }

    Object.keys(barbershopData).forEach((key) => {
      if (key !== "logo") {
        formData.append(key, barbershopData[key]);
      }
    });

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      };

      await axios.post(`${apiBaseUrl}/barbershop`, formData, { headers });

      Swal.fire({
        title: "Sucesso!",
        text: "Barbearia criada com sucesso!",
        icon: "success",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/barbershop";
        }
      });
    } catch (error) {
      console.error("Erro ao criar barbearia:", error);

      if (error.response && error.response.status === 422) {
        const validationErrors = error.response.data.errors;
        let errorMessage = "Os seguintes campos têm erros:\n";

        for (const field in validationErrors) {
          errorMessage += `${field}: ${validationErrors[field].join(", ")}\n`;
        }

        Swal.fire({
          title: "Validação Falhou",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro ao tentar criar a barbearia. Tente novamente mais tarde.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Nova Barbearia</p>
      <Container className="main-container" fluid>
        <Row className="section-row justify-content-center">
          <Col xs={12} lg={10} className="section-col">
            <Card className="card-component shadow-sm">
              <Card.Body className="card-body">
                {isProcessing ? (
                  <Col xs={12} className="loading-section">
                    <ProcessingIndicatorComponent messages={messages} />
                  </Col>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col xs={12} className="mb-4 text-center">
                        <div>
                          <label htmlFor="logoInput" style={{ cursor: "pointer" }}>
                            {logoPreview ? (
                              <img src={logoPreview} alt="Preview da Logo" className="img-component" />
                            ) : (
                              <img src="/images/barbershoplogo.png" alt="Preview da Logo" className="img-component" />
                            )}
                          </label>
                          <div className="mt-3">
                            <Button
                              variant="secondary"
                              className="action-button"
                              onClick={() => document.getElementById("logoInput").click()}
                            >
                              Adicionar logo
                            </Button>
                          </div>
                          <Form.Control
                            id="logoInput"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ display: "none" }}
                          />
                        </div>
                      </Col>

                      {/* Campos de entrada seguindo o padrão da UpdatePage */}
                     
                                           {/* Nome */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formName">
                                               <Form.Label>Nome</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="name"
                                                 value={barbershopData.name || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Email */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formEmail">
                                               <Form.Label>Email</Form.Label>
                                               <Form.Control
                                                 type="email"
                                                 name="email"
                                                 value={barbershopData.email || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Telefone */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formPhone">
                                               <Form.Label>Telefone</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="phone"
                                                 value={barbershopData.phone || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Cidade */}
                                           <Col md={3} className="mb-3">
                                             <Form.Group controlId="formCity">
                                               <Form.Label>Cidade</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="city"
                                                 value={barbershopData.city || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col> {/* UF */}
                                           <Col md={2} className="mb-3">
                                             <Form.Group controlId="formState">
                                               <Form.Label>UF</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="state"
                                                 value={barbershopData.state || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                     
                                           {/* Endereço */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formAddress">
                                               <Form.Label>Endereço</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="address"
                                                 value={barbershopData.address || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* CEP */}
                                           <Col md={3} className="mb-3">
                                             <Form.Group controlId="formZipcode">
                                               <Form.Label>CEP</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="zipcode"
                                                 value={barbershopData.zipcode || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                          
                                           {/* URL Google Maps */}
                                           <Col md={12} className="mb-3">
                                             <Form.Group controlId="formLocation">
                                               <Form.Label>URL Google Maps</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="location"
                                                 value={barbershopData.location || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Website */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formWebsite">
                                               <Form.Label>Website</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="website"
                                                 value={barbershopData.website || ""}
                                                 onChange={handleInputChange}
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Facebook */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formFacebook">
                                               <Form.Label>Facebook</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="facebook"
                                                 value={barbershopData.facebook || ""}
                                                 onChange={handleInputChange}
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Instagram */}
                                           <Col md={4} className="mb-3">
                                             <Form.Group controlId="formInstagram">
                                               <Form.Label>Instagram</Form.Label>
                                               <Form.Control
                                                 type="text"
                                                 name="instagram"
                                                 value={barbershopData.instagram || ""}
                                                 onChange={handleInputChange}
                                               />
                                             </Form.Group>
                                           </Col>
                     
                                           {/* Descrição */}
                                           <Col md={12} className="mb-3">
                                             <Form.Group controlId="formDescription">
                                               <Form.Label>Descrição</Form.Label>
                                               <Form.Control
                                                 as="textarea"
                                                 rows={3}
                                                 name="description"
                                                 value={barbershopData.description || ""}
                                                 onChange={handleInputChange}
                                                 required
                                               />
                                             </Form.Group>
                                           </Col>
                    </Row>

                    <div className="text-center">
                      <Button variant="primary" type="submit" className="action-button">
                        Incluir nova Barbearia
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default BarbershopCreatePage;

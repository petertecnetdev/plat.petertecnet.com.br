/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import NavlogComponent from '../../../components/NavlogComponent';
import ProcessingIndicatorComponent from '../../../components/ProcessingIndicatorComponent';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl } from '../../../config';

export default function EstablishmentCreatePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [data, setData] = useState({
    logo: null,
    background: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    location: '',
    website: '',
    facebook: '',
    instagram: '',
    description: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleResizeImage = (file, setPreview, width, height) => {
    const reader = new FileReader();
    if (!file || !file.type.startsWith('image/')) {
      Swal.fire({ title: 'Formato inválido', text: 'Selecione uma imagem válida.', icon: 'error', confirmButtonText: 'OK' });
      return;
    }
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataURL = canvas.toDataURL('image/png');
        setPreview(resizedDataURL);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = e => {
    const file = e.target.files[0];
    handleResizeImage(file, setLogoPreview, 150, 150);
    setData(prev => ({ ...prev, logo: file }));
  };

  const handleBackgroundChange = e => {
    const file = e.target.files[0];
    handleResizeImage(file, setBackgroundPreview, 1920, 600);
    setData(prev => ({ ...prev, background: file }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsProcessing(true);
    setMessages(['Aguarde enquanto cadastramos o estabelecimento...']);

    const formData = new FormData();
    if (logoPreview) {
      try {
        const logoBlob = await fetch(logoPreview).then(res => res.blob());
        formData.append('logo', logoBlob, 'logo.png');
      } catch (err) {
        console.error(err);
      }
    }
    if (backgroundPreview) {
      try {
        const backgroundBlob = await fetch(backgroundPreview).then(res => res.blob());
        formData.append('background', backgroundBlob, 'background.png');
      } catch (err) {
        console.error(err);
      }
    }

    Object.entries(data).forEach(([key, val]) => {
      if (key !== 'logo' && key !== 'background') formData.append(key, val);
    });

    try {
      await axios.post(`${apiBaseUrl}/establishment`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      Swal.fire({ title: 'Sucesso!', text: 'Estabelecimento criado com sucesso!', icon: 'success', confirmButtonText: 'OK' }).then(() => {
        window.location.href = '/establishment';
      });
    } catch (err) {
      if (err.response?.status === 422) {
        const errs = err.response.data.errors;
        let msg = 'Erros de validação:\n';
        Object.keys(errs).forEach(field => {
          msg += `${field}: ${errs[field].join(', ')}\n`;
        });
        Swal.fire({ title: 'Falhou', text: msg, icon: 'error', confirmButtonText: 'OK' });
      } else {
        Swal.fire({ title: 'Erro', text: 'Não foi possível criar o estabelecimento. Tente novamente.', icon: 'error', confirmButtonText: 'OK' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Novo Estabelecimento</p>
      <Container fluid className="main-container">
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
                        <label htmlFor="logoInput" style={{ cursor: 'pointer' }}>
                          <img src={logoPreview || '/images/establishment-default.png'} alt="Preview" className="img-component" />
                        </label>
                        <div className="mt-3">
                          <Button variant="secondary" className="action-button" onClick={() => document.getElementById('logoInput').click()}>
                            Adicionar logo
                          </Button>
                        </div>
                        <Form.Control id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                      </Col>

                      <Col xs={12} className="mb-4 text-center">
                        <label htmlFor="backgroundInput" style={{ cursor: 'pointer' }}>
                          <img src={backgroundPreview || '/images/background-default.png'} alt="Preview Background" className="img-fluid" style={{ maxHeight: 150 }} />
                        </label>
                        <div className="mt-3">
                          <Button variant="secondary" className="action-button" onClick={() => document.getElementById('backgroundInput').click()}>
                            Adicionar Background
                          </Button>
                        </div>
                        <Form.Control id="backgroundInput" type="file" accept="image/*" onChange={handleBackgroundChange} style={{ display: 'none' }} />
                      </Col>

                      <Col md={4} className="mb-3"><Form.Group controlId="formName"><Form.Label>Nome</Form.Label><Form.Control name="name" value={data.name} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formEmail"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={data.email} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formPhone"><Form.Label>Telefone</Form.Label><Form.Control name="phone" value={data.phone} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={3} className="mb-3"><Form.Group controlId="formCity"><Form.Label>Cidade</Form.Label><Form.Control name="city" value={data.city} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={2} className="mb-3"><Form.Group controlId="formState"><Form.Label>UF</Form.Label><Form.Control name="state" value={data.state} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formAddress"><Form.Label>Endereço</Form.Label><Form.Control name="address" value={data.address} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={3} className="mb-3"><Form.Group controlId="formZipcode"><Form.Label>CEP</Form.Label><Form.Control name="zipcode" value={data.zipcode} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={12} className="mb-3"><Form.Group controlId="formLocation"><Form.Label>URL Google Maps</Form.Label><Form.Control name="location" value={data.location} onChange={handleInputChange} required /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formWebsite"><Form.Label>Website</Form.Label><Form.Control name="website" value={data.website} onChange={handleInputChange} /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formFacebook"><Form.Label>Facebook</Form.Label><Form.Control name="facebook" value={data.facebook} onChange={handleInputChange} /></Form.Group></Col>
                      <Col md={4} className="mb-3"><Form.Group controlId="formInstagram"><Form.Label>Instagram</Form.Label><Form.Control name="instagram" value={data.instagram} onChange={handleInputChange} /></Form.Group></Col>
                      <Col md={12} className="mb-3"><Form.Group controlId="formDescription"><Form.Label>Descrição</Form.Label><Form.Control as="textarea" rows={3} name="description" value={data.description} onChange={handleInputChange} required /></Form.Group></Col>
                    </Row>
                    <div className="text-center">
                      <Button variant="primary" type="submit" className="action-button">Incluir novo Estabelecimento</Button>
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
}

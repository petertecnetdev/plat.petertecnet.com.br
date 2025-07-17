import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card } from 'react-bootstrap';
import NavlogComponent from '../../../components/NavlogComponent';
import ProcessingIndicatorComponent from '../../../components/ProcessingIndicatorComponent';
import Swal from 'sweetalert2';
import axios from 'axios';
import { apiBaseUrl, storageUrl } from '../../../config';
import { useParams } from 'react-router-dom';

export default function EstablishmentUpdatePage() {
  const { id } = useParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [data, setData] = useState({
    logo: null,
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
  const [originalData, setOriginalData] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    async function fetchEstablishment() {
      try {
        const response = await axios.get(
          `${apiBaseUrl}/establishment/show/${id}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        const { establishment } = response.data;
        setData({
          logo: null,
          name: establishment.name || '',
          email: establishment.email || '',
          phone: establishment.phone || '',
          address: establishment.address || '',
          city: establishment.city || '',
          state: establishment.state || '',
          zipcode: establishment.zipcode || '',
          location: establishment.location || '',
          website: establishment.website || '',
          facebook: establishment.facebook || '',
          instagram: establishment.instagram || '',
          description: establishment.description || ''
        });
        setOriginalData(establishment);
        if (establishment.logo) {
          setLogoPreview(`${storageUrl}/${establishment.logo}`);
        }
      } catch (error) {
        Swal.fire({
          title: 'Erro',
          text: 'Não foi possível carregar os dados.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
    fetchEstablishment();
  }, [id]);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  }

  function handleImageChange(file, setPreview, width, height) {
    if (!file || !file.type.startsWith('image/')) {
      Swal.fire({ title: 'Formato inválido', text: 'Selecione uma imagem válida.', icon: 'error', confirmButtonText: 'OK' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png');
        setPreview(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  }

  function handleLogoSelect(e) {
    const file = e.target.files[0];
    handleImageChange(file, setLogoPreview, 150, 150);
    setData(prev => ({ ...prev, logo: file }));
  }

  function handleImageError(e) {
    if (!e.target.src.includes('/images/establishment-default.png')) {
      e.target.src = '/images/establishment-default.png';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsProcessing(true);
    setMessages(['Aguarde enquanto atualizamos o estabelecimento...']);
    const formData = new FormData();
    if (logoPreview) {
      try {
        const blob = await fetch(logoPreview).then(res => res.blob());
        formData.append('logo', blob, 'logo.png');
      } catch (err) {
        console.error('Erro no processamento da imagem:', err);
      }
    }
    Object.keys(data).forEach(key => {
      if (key === 'logo') return;
      if (data[key] !== originalData[key]) {
        formData.append(key, data[key]);
      }
    });
    try {
      await axios.post(
        `${apiBaseUrl}/establishment/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      Swal.fire({ title: 'Sucesso!', text: 'Estabelecimento atualizado.', icon: 'success', confirmButtonText: 'OK' }).then(() => {
        window.location.href = '/establishment';
      });
    } catch (err) {
      if (err.response?.status === 422) {
        let msg = 'Erros de validação:\n';
        Object.entries(err.response.data.errors).forEach(([field, errors]) => {
          msg += `${field}: ${errors.join(', ')}\n`;
        });
        Swal.fire({ title: 'Falhou', text: msg, icon: 'error', confirmButtonText: 'OK' });
      } else {
        Swal.fire({ title: 'Erro', text: 'Não foi possível atualizar.', icon: 'error', confirmButtonText: 'OK' });
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <NavlogComponent />
      <p className="section-title text-center">Atualizar Estabelecimento</p>
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
                          <img
                            src={logoPreview || '/images/establishment-default.png'}
                            alt="Preview"
                            className="img-component"
                            onError={handleImageError}
                          />
                        </label>
                        <div className="mt-3">
                          <Button
                            variant="secondary"
                            className="action-button"
                            onClick={() => document.getElementById('logoInput').click()}
                          >
                            Adicionar logo
                          </Button>
                        </div>
                        <Form.Control
                          id="logoInput"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          style={{ display: 'none' }}
                        />
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formName">
                          <Form.Label>Nome</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={data.name}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formEmail">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formPhone">
                          <Form.Label>Telefone</Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={data.phone}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="formCity">
                          <Form.Label>Cidade</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={data.city}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Group controlId="formState">
                          <Form.Label>UF</Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            value={data.state}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formAddress">
                          <Form.Label>Endereço</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={data.address}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="formZipcode">
                          <Form.Label>CEP</Form.Label>
                          <Form.Control
                            type="text"
                            name="zipcode"
                            value={data.zipcode}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="formLocation">
                          <Form.Label>URL Google Maps</Form.Label>
                          <Form.Control
                            type="text"
                            name="location"
                            value={data.location}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formWebsite">
                          <Form.Label>Website</Form.Label>
                          <Form.Control
                            type="text"
                            name="website"
                            value={data.website}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formFacebook">
                          <Form.Label>Facebook</Form.Label>
                          <Form.Control
                            type="text"
                            name="facebook"
                            value={data.facebook}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="formInstagram">
                          <Form.Label>Instagram</Form.Label>
                          <Form.Control
                            type="text"
                            name="instagram"
                            value={data.instagram}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12} className="mb-3">
                        <Form.Group controlId="formDescription">
                          <Form.Label>Descrição</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={data.description}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="text-center">
                      <Button variant="primary" type="submit" className="action-button">
                        Atualizar Estabelecimento
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
}

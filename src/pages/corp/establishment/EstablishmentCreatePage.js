import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import axios from 'axios';
import NavlogComponent from '../../../components/NavlogComponent';
import ProcessingIndicatorComponent from '../../../components/ProcessingIndicatorComponent';
import './Establishment.css';
import { apiBaseUrl } from '../../../config';

const categoryOptions = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'hamburgueria', label: 'Hamburgueria' },
  { value: 'sorveteria', label: 'Sorveteria' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'doceria', label: 'Doceria' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'pub', label: 'Pub' }
];

export default function EstablishmentCreatePage() {
  const navigate = useNavigate();
  const [logoPreview, setLogoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { segments: [] } });

  const resizeImage = (file, width, height, callback) => {
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
        callback(canvas.toDataURL('image/png'));
      };
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e, field, width, height, setPreview) => {
    const file = e.target.files[0];
    if (file?.type.startsWith('image/')) {
      resizeImage(file, width, height, dataUrl => {
        setPreview(dataUrl);
      });
      setValue(field, file);
    } else {
      Swal.fire('Formato inválido', 'Selecione uma imagem válida.', 'error');
    }
  };

  const onSubmit = async values => {
    const formData = new FormData();
    if (logoPreview) {
      const blob = await fetch(logoPreview).then(r => r.blob());
      formData.append('logo', blob, 'logo.png');
    }
    if (backgroundPreview) {
      const blob = await fetch(backgroundPreview).then(r => r.blob());
      formData.append('background', blob, 'background.png');
    }

    Object.entries(values).forEach(([key, val]) => {
      if (key === 'segments') {
        val.forEach(seg => formData.append('segments[]', seg));
      } else {
        formData.append(key, val || '');
      }
    });

    try {
      await axios.post(`${apiBaseUrl}/establishment`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      Swal.fire('Sucesso', 'Estabelecimento criado!', 'success').then(() => navigate('/establishment'));
    } catch (err) {
      if (err.response?.status === 422) {
        const msg = Object.entries(err.response.data.errors)
          .map(([f, m]) => `${f}: ${m.join(', ')}`)
          .join('\n');
        Swal.fire('Validação', msg, 'error');
      } else {
        Swal.fire('Erro', 'Não foi possível criar.', 'error');
      }
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
                {isSubmitting ? (
                  <div className="loading-section text-center">
                    <ProcessingIndicatorComponent messages={[ 'Aguarde...' ]} />
                  </div>
                ) : (
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="mb-4 justify-content-center">
                      <Col xs={6} md={3} className="text-center">
                        <label htmlFor="logoInput" className="d-block">
                          <img src={logoPreview || '/images/establishment-default.png'} alt="Logo" className="img-component" />
                        </label>
                        <Button onClick={() => document.getElementById('logoInput').click()} className="action-button mt-2">
                          Adicionar Logo
                        </Button>
                        <Form.Control
                          id="logoInput"
                          type="file"
                          accept="image/*"
                          hidden
                          {...register('logo')}
                          onChange={e => onFileChange(e, 'logo', 150, 150, setLogoPreview)}
                        />
                      </Col>
                      <Col xs={6} md={8} className="text-center">
                        <label htmlFor="bgInput" className="d-block">
                          <img src={backgroundPreview || '/images/background-default.png'} alt="Background" className="img-fluid" style={{ maxHeight: 150 }} />
                        </label>
                        <Button onClick={() => document.getElementById('bgInput').click()} className="action-button mt-2">
                          Adicionar Background
                        </Button>
                        <Form.Control
                          id="bgInput"
                          type="file"
                          accept="image/*"
                          hidden
                          {...register('background')}
                          onChange={e => onFileChange(e, 'background', 1920, 600, setBackgroundPreview)}
                        />
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="name">
                          <Form.Label>Nome</Form.Label>
                          <Form.Control type="text" {...register('name', { required: true })} isInvalid={errors.name} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="fantasy">
                          <Form.Label>Nome Fantasia</Form.Label>
                          <Form.Control type="text" {...register('fantasy', { required: true })} isInvalid={errors.fantasy} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Group controlId="cnpj">
                          <Form.Label>CNPJ</Form.Label>
                          <Form.Control type="text" {...register('cnpj', { required: true })} isInvalid={errors.cnpj} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={2} className="mb-3">
                        <Form.Group controlId="type">
                          <Form.Label>Tipo</Form.Label>
                          <Form.Control type="text" {...register('type', { required: true })} isInvalid={errors.type} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={4} className="mb-3">
                        <Form.Group controlId="category">
                          <Form.Label>Categoria*</Form.Label>
                          <Form.Select {...register('category', { required: true })} isInvalid={errors.category}>
                            <option value="">Selecione...</option>
                            {categoryOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="email">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" {...register('email', { required: true })} isInvalid={errors.email} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={4} className="mb-3">
                        <Form.Group controlId="phone">
                          <Form.Label>Telefone</Form.Label>
                          <Form.Control type="text" {...register('phone', { required: true })} isInvalid={errors.phone} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group controlId="address">
                          <Form.Label>Endereço</Form.Label>
                          <Form.Control type="text" {...register('address', { required: true })} isInvalid={errors.address} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="city">
                          <Form.Label>Cidade</Form.Label>
                          <Form.Control type="text" {...register('city', { required: true })} isInvalid={errors.city} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={3} className="mb-3">
                        <Form.Group controlId="state">
                          <Form.Label>UF</Form.Label>
                          <Form.Control type="text" {...register('state', { required: true })} isInvalid={errors.state} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group controlId="location">
                          <Form.Label>Localização (Google Maps)</Form.Label>
                          <Form.Control type="text" {...register('location', { required: true })} isInvalid={errors.location} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group controlId="description">
                          <Form.Label>Descrição</Form.Label>
                          <Form.Control as="textarea" rows={3} {...register('description', { required: true })} isInvalid={errors.description} />
                          <Form.Control.Feedback type="invalid">Requerido</Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={12} className="mb-3">
                        <Form.Label>Redes Sociais</Form.Label>
                        <Row>
                          <Col md={4} className="mb-2">
                            <Form.Control placeholder="Facebook" {...register('facebook')} />
                          </Col>
                          <Col md={4} className="mb-2">
                            <Form.Control placeholder="Instagram" {...register('instagram')} />
                          </Col>
                          <Col md={4} className="mb-2">
                            <Form.Control placeholder="Twitter" {...register('twitter')} />
                          </Col>
                          <Col md={4} className="mb-2">
                            <Form.Control placeholder="YouTube" {...register('youtube')} />
                          </Col>
                        </Row>
                      </Col>

                      <Col md={12} className="mb-4">
                        <Form.Group>
                          <Form.Label>Segmentos Atendidos</Form.Label>
                          <div>
                            <Form.Check inline label="Delivery" value="delivery" type="checkbox" {...register('segments')} />
                            <Form.Check inline label="Retirada no local" value="pickup" type="checkbox" {...register('segments')} />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="text-center">
                      <Button type="submit" variant="primary" disabled={isSubmitting} className="action-button">
                        Incluir novo estabelecimento
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

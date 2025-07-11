import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import Swal from "sweetalert2"; // Importa o SweetAlert2
import authService from "../../services/AuthService";
import barbershopService from "../../services/BarbershopService"; // Importando o serviço de barbearias
import NavlogComponent from "../../components/NavlogComponent";
import { storageUrl } from "../../config";
import { Link } from "react-router-dom";

const UserViewPage = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [barbershops, setBarbershops] = useState([]); // Estado para armazenar as barbearias

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.me();
        setUser(userData);
        
        // Busca as barbearias se existirem IDs
        if (userData.extra_info && userData.extra_info.barbershop) {
          const barbershopPromises = userData.extra_info.barbershop.map(id => 
            barbershopService.show(id) // Faz a chamada para obter as barbearias
          );
          const barbershopData = await Promise.all(barbershopPromises);
          setBarbershops(barbershopData); // Armazena as barbearias no estado
        }
      } catch (error) {
        console.error(error);
        setError("Erro ao carregar os dados do usuário. Por favor, tente novamente.");
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <NavlogComponent />
      <Container fluid>
        <Row className="justify-content-left m-4">
          <Col md={12}>
            <Card>
              <Card.Body>
                {error && (
                  Swal.fire({
                    title: "Erro",
                    text: error,
                    icon: "error",
                    customClass: {
                      popup: "custom-swal",
                      title: "custom-swal-title",
                      content: "custom-swal-text",
                    },
                  }) // Alerta de erro SweetAlert
                )}

                {user && (
                  <>
                    <p className="labeltitle h4 text-center text-uppercase">{user.first_name}</p>
                    
                    <Row className="text-center">
                      <Col xs={12} sm={6} md={4}>
                        <Card className="card-barbershop-show">
                          <div
                            className="background-image"
                            style={{
                              backgroundImage: `url('${storageUrl}/${user.avatar}')`,
                            }}
                          />
                          <Link
                            to={`/user/${user.user_name}`}
                            style={{ textDecoration: "none" }}
                          >
                        
                          </Link>
                          <Card.Body>
                          <img
                              src={`${storageUrl}/${user.avatar}`}
                              className="rounded-circle img-logo-barbershop-show"
                              style={{ margin: '0 auto', display: 'block' }}
                              alt={user.first_name}
                            />
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={12} sm={6} md={8}>
                        <Card className="card-barbershop-show">
                          <Card.Body>
                            <p className="h6">Email: {user.email}</p>
                            <p className="h6">Telefone: {user.phone}</p>
                            <ul>
                {barbershops.map(barbershop => (
                    <li key={barbershop.id}>{barbershop.name}</li> // Supondo que `name` é um dos campos da barbearia
                ))}
            </ul>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default UserViewPage;

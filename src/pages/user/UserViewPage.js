import React, { useEffect, useState } from "react";
import { Card, Col, Container, Row } from "react-bootstrap";
import Swal from "sweetalert2";
import { useParams } from "react-router-dom";
import NavlogComponent from "../../components/NavlogComponent";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import userService from "../../services/UserService";
import { storageUrl } from "../../config";

export default function UserViewPage() {
  const { userName } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.view(userName);
        setUser(data.user || data);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: error?.message || "Não foi possível carregar o usuário.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [userName]);

  const avatar = user?.avatar ? `${storageUrl}/${user.avatar}` : "/images/user.png";

  return (
    <>
      <NavlogComponent />
      {loading ? (
        <ProcessingIndicatorComponent messages={["Carregando perfil…"]} />
      ) : (
        <Container className="main-container" fluid>
          <Row className="justify-content-center">
            <Col xs={12} lg={9}>
              <Card className="card-component">
                <Card.Body>
                  {user ? (
                    <Row className="align-items-center gy-4">
                      <Col xs={12} md={4} className="text-center">
                        <img
                          src={avatar}
                          alt={user.first_name || user.user_name || "Usuário"}
                          className="avatar-preview"
                          onError={(event) => {
                            event.currentTarget.src = "/images/user.png";
                          }}
                        />
                      </Col>
                      <Col xs={12} md={8}>
                        <h1 className="page-header mb-3">
                          {user.first_name || "Usuário"} {user.last_name || ""}
                        </h1>
                        {user.user_name && <p><strong>Usuário:</strong> @{user.user_name}</p>}
                        {user.email && <p><strong>Email:</strong> {user.email}</p>}
                        {user.phone && <p><strong>Telefone:</strong> {user.phone}</p>}
                        {user.city && <p><strong>Localização:</strong> {user.city}{user.uf ? ` - ${user.uf}` : ""}</p>}
                        {user.occupation && <p><strong>Ocupação:</strong> {user.occupation}</p>}
                        {user.about && <p><strong>Sobre:</strong> {user.about}</p>}
                      </Col>
                    </Row>
                  ) : (
                    <p className="empty-text mb-0">Usuário não encontrado.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      )}
    </>
  );
}

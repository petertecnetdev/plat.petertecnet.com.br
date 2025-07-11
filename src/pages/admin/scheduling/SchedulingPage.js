import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import NavlogComponent from "../components/NavlogComponent";

const SchedulingPage = () => {
  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-content">
        <Row className="justify-content-center mt-5">
          <Col md={8}>
            <Card className="text-center">
              <Card.Body>
                <h1 className="h4 text-uppercase text-muted">Em Construção</h1>
                <p className="mt-3 text-muted">
                  A funcionalidade de agendamento está em desenvolvimento e em
                  breve estará disponível na plataforma Razoio. Fique atento
                  para novidades!
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SchedulingPage;

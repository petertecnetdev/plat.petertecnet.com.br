import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { LineChart, Line } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import NavlogComponent from "../components/NavlogComponent";
import { Container, Row, Col, Card } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';

// Dados fictícios para os gráficos
const barData = [
  { name: 'Janeiro', vendas: 4000 },
  { name: 'Fevereiro', vendas: 3000 },
  { name: 'Março', vendas: 2000 },
  { name: 'Abril', vendas: 2780 },
  { name: 'Maio', vendas: 1890 },
];

const lineData = [
  { name: 'Janeiro', visitantes: 2400 },
  { name: 'Fevereiro', visitantes: 2210 },
  { name: 'Março', visitantes: 2290 },
  { name: 'Abril', visitantes: 2000 },
  { name: 'Maio', visitantes: 2181 },
];

const areaData = [
  { name: 'Janeiro', lucros: 2400 },
  { name: 'Fevereiro', lucros: 2210 },
  { name: 'Março', lucros: 2290 },
  { name: 'Abril', lucros: 2000 },
  { name: 'Maio', lucros: 2181 },
];

const pieData = [
  { name: 'Grupo A', value: 400 },
  { name: 'Grupo B', value: 300 },
  { name: 'Grupo C', value: 300 },
  { name: 'Grupo D', value: 200 },
];

// Definindo cores para o gráfico de pizza
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  return (
    <Container className="mt-4">
      <NavlogComponent /> {/* Adicionando o NavlogComponent aqui */}

      <Row className="mb-4">
        {/* Card para Gráfico de Barras */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h2>Vendas por Mês</h2>
            </Card.Header>
            <Card.Body>
              <BarChart width={500} height={300} data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="vendas" fill="#8884d8" />
              </BarChart>
            </Card.Body>
          </Card>
        </Col>

        {/* Card para Gráfico de Linhas */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h2>Visitantes por Mês</h2>
            </Card.Header>
            <Card.Body>
              <LineChart width={500} height={300} data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="visitantes" stroke="#82ca9d" />
              </LineChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        {/* Card para Gráfico de Área */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h2>Lucros por Mês</h2>
            </Card.Header>
            <Card.Body>
              <AreaChart width={500} height={300} data={areaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="lucros" stroke="#FFBB28" fillOpacity={0.3} fill="#FFBB28" />
              </AreaChart>
            </Card.Body>
          </Card>
        </Col>

        {/* Card para Gráfico de Pizza */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h2>Distribuição de Grupos</h2>
            </Card.Header>
            <Card.Body>
              <PieChart width={500} height={300}>
                <Pie
                  data={pieData}
                  cx={250}
                  cy={150}
                  labelLine={false}
                  label={entry => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

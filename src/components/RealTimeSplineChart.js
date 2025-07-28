// src/components/RealTimeSplineChart.js
import React from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-apexcharts';
import './RealTimeOrdersChart.css';

export default function RealTimeSplineChart({ data }) {
  const options = {
    chart: { id: 'realtime', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2, colors: ['#00e676'] },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0, stops: [0, 90] }
    },
    grid: { borderColor: '#333' },
    xaxis: {
      categories: data.map(d => d.time),
      labels: { style: { colors: '#aaa' } }
    },
    yaxis: {
      labels: { style: { colors: '#aaa' } },
      min: 0
    },
    tooltip: { theme: 'dark' }
  };

  const series = [
    { name: 'Pedidos', data: data.map(d => d.count) }
  ];

  return (
    <div className="chart-wrapper">
      <Chart
        options={options}
        series={series}
        type="area"
        height={240}
      />
    </div>
  );
}

RealTimeSplineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      time: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired
};

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

const ReportDetail = ({ opuData }) => {
  const navigate = useNavigate();

  // Preparar datos para el gráfico
  const chartData = {
    labels: opuData.registros.map(r => r.donante),
    datasets: [
      {
        label: '% CLIVADOS',
        data: opuData.registros.map(r => parseInt(r.clivados_percent)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: '% EMBRIONES',
        data: opuData.registros.map(r => parseInt(r.prevision_percent)),
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Porcentaje'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 10,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'PRODUCCIÓN POR DONANTES'
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-file-text me-2"></i>
          Detalle de OPU
        </h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/reports')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la lista
        </button>
      </div>

      <div className="detailed-report">
        {/* Encabezado del informe */}
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="text-center mb-4">INFORME PRODUCCIÓN DE EMBRIONES BOVINOS OPU/FIV - BIOGENETIC IN-VITRO SAS</h3>
            <div className="row">
              <div className="col-12">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th>CLIENTE</th>
                      <td>{opuData.cliente}</td>
                      <th>LUGAR</th>
                      <td>{opuData.lugar}</td>
                      <th>HORA INICIO OPU</th>
                      <td>{opuData.hora_inicio}</td>
                      <th>ENVASE</th>
                      <td>{opuData.envase}</td>
                    </tr>
                    <tr>
                      <th>FECHA OPU</th>
                      <td>{opuData.fecha_opu}</td>
                      <th>FINCA</th>
                      <td>{opuData.finca}</td>
                      <th>HORA FINAL OPU</th>
                      <td>{opuData.hora_final}</td>
                      <th>FECHA DE TRANSFERENCIA</th>
                      <td>{opuData.fecha_transferencia}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de resultados */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-light">
                  <tr>
                    <th>N°</th>
                    <th>DONANTES</th>
                    <th>RAZA</th>
                    <th>TOROS</th>
                    <th colSpan="3" className="text-center">OOCITOS VIABLES</th>
                    <th>VIABLES</th>
                    <th>OTROS</th>
                    <th>TOTAL</th>
                    <th>CUV</th>
                    <th>CLIVADOS</th>
                    <th>% CLIV.</th>
                    <th>PREVISIÓN</th>
                    <th>%</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th>GI</th>
                    <th>GII</th>
                    <th>GIII</th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {opuData.registros.map((registro, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{registro.donante}</td>
                      <td>{registro.raza}</td>
                      <td>{registro.toro}</td>
                      <td>{registro.g1}</td>
                      <td>{registro.g2}</td>
                      <td>{registro.g3}</td>
                      <td>{registro.viables}</td>
                      <td>{registro.otros}</td>
                      <td>{registro.total}</td>
                      <td>{registro.cuv}</td>
                      <td>{registro.clivados}</td>
                      <td>{registro.clivados_percent}</td>
                      <td>{registro.prevision}</td>
                      <td>{registro.prevision_percent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="card">
          <div className="card-body">
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div className="chart-container" style={{ height: '300px', maxWidth: '800px', margin: '0 auto' }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetail; 
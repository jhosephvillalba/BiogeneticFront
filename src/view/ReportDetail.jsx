import React from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
// Registrar componentes de Chart.js
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const ReportDetail = ({ opuData }) => {
  const navigate = useNavigate();

  const handleDate = (date) => {
    // Convertimos a objeto Date
    // console.log("-->>>>>>>>>>>>", date);
    const dateObj = new Date(date);
    // Sumamos 5 días
    dateObj.setDate(dateObj.getDate() + 5);
    // Formateamos nuevamente en formato YYYY-MM-DD
    return dateObj.toISOString().split("T")[0];
  };

  // Validar datos
  const registros = opuData.registros || [];
  console.log("registros", registros);

  // Preparar datos para el gráfico (dinámico)
  const labels = registros.map((_, idx) => `Registro ${idx + 1}`);

  const clivadosData = registros.map(r =>
    parseFloat((r.clivados_percent || "0").replace("%", ""))
  );
  const totalData = registros.map(r =>
    parseFloat((r.porcentaje_total_embriones || "0").replace("%", ""))
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "% Clivados",
        data: clivadosData,
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "% Total Embriones",
        data: totalData,
        backgroundColor: "rgba(255, 206, 86, 0.8)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      }
    ]
  };

  console.log("chartData", chartData);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Porcentaje (%)",
          font: {
            size: 12,
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value) {
            return value + "%";
          },
        },
      },
      x: {
        stacked: false,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 20,
          padding: 10,
          font: {
            size: 11,
            weight: "bold",
          },
        },
      },
      title: {
        display: true,
        text: "COMPARACIÓN DE PORCENTAJES POR REGISTRO",
        font: {
          size: 14,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
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
          onClick={() => navigate("/reports")}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la lista
        </button>
      </div>

      <div className="detailed-report">
        {/* Encabezado del informe */}
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="text-center mb-4">
              INFORME PRODUCCIÓN DE EMBRIONES BOVINOS OPU/FIV - BIOGENETIC
              IN-VITRO SAS
            </h3>
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
                      <td>{handleDate(opuData.fecha_opu)}</td>
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
                    <th colSpan="3" className="text-center">
                      OOCITOS VIABLES
                    </th>
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
                  {registros.map((registro, index) => (
                    <tr key={registro.id || `registro-${index}`}>
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
              <div className="col-md-12">
                <div
                  className="chart-container"
                  style={{ height: "500px", margin: "0 auto" }}
                >
                  {registros.length === 0 ? (
                    <div className="alert alert-warning text-center">
                      No hay datos suficientes para mostrar el gráfico.
                    </div>
                  ) : (
                    <Bar data={chartData} options={chartOptions} />
                  )}
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

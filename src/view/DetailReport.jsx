import React from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate, useParams } from "react-router-dom";

const DetailReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleDate = (date) => {
    // Convertimos a objeto Date
    // console.log("-->>>>>>>>>>>>", date)
    const dateObj = new Date(date);
    // Sumamos 5 días
    dateObj.setDate(dateObj.getDate() + 5);
    // Formateamos nuevamente en formato YYYY-MM-DD
    return dateObj.toISOString().split("T")[0];
  };

  // Datos hardcodeados para simular la respuesta de una API
  const mockData = {
    1: {
      id: 1,
      cliente: "John Fredy Plaza",
      lugar: "San Vicente del Caguan",
      fecha_opu: "29/11/2024",
      hora_inicio: "9:36 a.m.",
      hora_final: "12:43 p.m.",
      finca: "La paz",
      fecha_transferencia: "7/12/2024",
      envase: "Campo",
      registros: [
        {
          donante: "002",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 8,
          g3: 8,
          viables: 18,
          otros: 2,
          total: 20,
          cuv: 15,
          clivados: 7,
          clivados_percent: "47",
          prevision: 5,
          prevision_percent: "33",
        },
        {
          donante: "132",
          raza: "Gyr",
          toro: "Hancock",
          g1: 1,
          g2: 9,
          g3: 7,
          viables: 17,
          otros: 3,
          total: 20,
          cuv: 16,
          clivados: 10,
          clivados_percent: "63",
          prevision: 4,
          prevision_percent: "25",
        },
        {
          donante: "036",
          raza: "Gyr",
          toro: "Hancock",
          g1: 10,
          g2: 20,
          g3: 30,
          viables: 60,
          otros: 5,
          total: 65,
          cuv: 42,
          clivados: 15,
          clivados_percent: "36",
          prevision: 6,
          prevision_percent: "14",
        },
        {
          donante: "005",
          raza: "Gyr",
          toro: "Hancock",
          g1: 3,
          g2: 10,
          g3: 6,
          viables: 19,
          otros: 3,
          total: 22,
          cuv: 16,
          clivados: 9,
          clivados_percent: "56",
          prevision: 2,
          prevision_percent: "14",
        },
        {
          donante: "522-27",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 8,
          g3: 3,
          viables: 39,
          otros: 0,
          total: 39,
          cuv: 31,
          clivados: 20,
          clivados_percent: "65",
          prevision: 6,
          prevision_percent: "19",
        },
        {
          donante: "1039",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 8,
          g3: 10,
          viables: 20,
          otros: 3,
          total: 23,
          cuv: 17,
          clivados: 9,
          clivados_percent: "53",
          prevision: 6,
          prevision_percent: "35",
        },
        {
          donante: "1043",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 9,
          g3: 5,
          viables: 35,
          otros: 3,
          total: 38,
          cuv: 25,
          clivados: 12,
          clivados_percent: "48",
          prevision: 4,
          prevision_percent: "16",
        },
        {
          donante: "030",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 2,
          g3: 2,
          viables: 16,
          otros: 4,
          total: 20,
          cuv: 14,
          clivados: 10,
          clivados_percent: "71",
          prevision: 4,
          prevision_percent: "29",
        },
        {
          donante: "550",
          raza: "Gyr",
          toro: "Hancock",
          g1: 2,
          g2: 20,
          g3: 20,
          viables: 42,
          otros: 3,
          total: 45,
          cuv: 37,
          clivados: 20,
          clivados_percent: "54",
          prevision: 8,
          prevision_percent: "22",
        },
      ],
      observaciones:
        "En general oocitos expandidos, con alta cantidad de detritos celulares y en el cultivo se evidencian estructuras en degeneración con núcleo sin homogeneidad",
    },
  };

  const opuData = mockData[id];

  if (!opuData) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger">
          No se encontró el informe solicitado
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = {
    labels: opuData.registros.map((r) => r.donante),
    datasets: [
      {
        label: "% CLIVADOS",
        data: opuData.registros.map((r) => parseInt(r.clivados_percent)),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "% EMBRIONES",
        data: opuData.registros.map((r) => parseInt(r.prevision_percent)),
        backgroundColor: "rgba(255, 206, 86, 0.8)",
      },
    ],
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
          text: "Porcentaje",
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: 11,
          },
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
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "PRODUCCIÓN POR DONANTES",
      },
    },
  };

  // Calcular totales
  const totales = opuData.registros.reduce(
    (acc, curr) => ({
      g1: acc.g1 + curr.g1,
      g2: acc.g2 + curr.g2,
      g3: acc.g3 + curr.g3,
      viables: acc.viables + curr.viables,
      otros: acc.otros + curr.otros,
      total: acc.total + curr.total,
      cuv: acc.cuv + curr.cuv,
      clivados: acc.clivados + curr.clivados,
      prevision: acc.prevision + curr.prevision,
    }),
    {
      g1: 0,
      g2: 0,
      g3: 0,
      viables: 0,
      otros: 0,
      total: 0,
      cuv: 0,
      clivados: 0,
      prevision: 0,
    }
  );

  return (
    <div className="container-fluid mt-3">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
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
                      <th className="bg-light">CLIENTE</th>
                      <td>{opuData.cliente}</td>
                      <th className="bg-light">LUGAR</th>
                      <td>{opuData.lugar}</td>
                      <th className="bg-light">HORA INICIO OPU</th>
                      <td>{opuData.hora_inicio}</td>
                      <th className="bg-light">ENVASE</th>
                      <td>{opuData.envase}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">FECHA OPU</th>
                      <td>{opuData.fecha_opu}</td>
                      <th className="bg-light">FINCA</th>
                      <td>{opuData.finca}</td>
                      <th className="bg-light">HORA FINAL OPU</th>
                      <td>{opuData.hora_final}</td>
                      <th className="bg-light">FECHA DE TRANSFERENCIA</th>
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
                      <td>{registro.clivados_percent}%</td>
                      <td>{registro.prevision}</td>
                      <td>{registro.prevision_percent}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="text-end">
                      <strong>TOTALES:</strong>
                    </td>
                    <td>{totales.g1}</td>
                    <td>{totales.g2}</td>
                    <td>{totales.g3}</td>
                    <td>{totales.viables}</td>
                    <td>{totales.otros}</td>
                    <td>{totales.total}</td>
                    <td>{totales.cuv}</td>
                    <td>{totales.clivados}</td>
                    <td>
                      {Math.round((totales.clivados / totales.total) * 100)}%
                    </td>
                    <td>{totales.prevision}</td>
                    <td>
                      {Math.round((totales.prevision / totales.total) * 100)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Datos de Mando */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-4">DATOS DE MANDO</h5>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>TOROS</th>
                    <th>RAZA</th>
                    <th>RGD</th>
                    <th>CANTIDAD TRABAJADA</th>
                    <th>N° DONANTES</th>
                    <th>CULTIVADOS</th>
                    <th>PRODUCCION TOTAL</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{opuData.registros[0]?.toro || "Hancock"}</td>
                    <td>{opuData.registros[0]?.raza || "Ho"}</td>
                    <td>550HO1457</td>
                    <td>1.5</td>
                    <td>{opuData.registros.length}</td>
                    <td>{totales.cuv}</td>
                    <td>{totales.prevision}</td>
                    <td>
                      {Math.round((totales.prevision / totales.total) * 100)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row justify-content-center">
              <div className="col-md-8">
                <div
                  className="chart-container"
                  style={{
                    height: "300px",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">OBSERVACIONES</h5>
            <p className="card-text">{opuData.observaciones}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailReport;

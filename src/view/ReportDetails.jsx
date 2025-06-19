import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import html2pdf from "html2pdf.js";

import { getOpusByProduction } from "../Api/opus";
import { getProductionById } from "../Api/productionEmbrionary";
import { getUserById } from "../Api/users";
import { getOutputById } from "../Api/outputs";
import { getInputById } from "../Api/inputs";
import { getBull } from "../Api/bulls";
import { getRaceById } from "../Api/races";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [registros, setRegistros] = useState([]);
  const [production, setProduction] = useState(null);
  const [currentUserReport, setCurrentUserReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [muestraInfo, setMuestraInfo] = useState(null);

  const handleDate = (date) => {
    // Convertimos a objeto Date
    // console.log("-->>>>>>>>>>>>", date);
    const dateObj = new Date(date);
    // Sumamos 5 días
    dateObj.setDate(dateObj.getDate() + 5);
    // Formateamos nuevamente en formato YYYY-MM-DD
    return dateObj.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOpusByProduction(id);
        const dataProduction = await getProductionById(id);

        setRegistros(data);
        console.log({ data: data });
        setProduction(dataProduction);

        const userReport = await getUserById(dataProduction.cliente_id);

        setCurrentUserReport(userReport);

        // Obtener info de la muestra utilizada
        if (dataProduction.output_id) {
          const output = await getOutputById(dataProduction.output_id);
          const input = await getInputById(output.input_id);
          const toro = await getBull(input.bull_id);
          let razaNombre = toro.race_name;
          if (!razaNombre && toro.race_id) {
            try {
              const raza = await getRaceById(toro.race_id);
              razaNombre = raza.name;
            } catch {}
          }
          setMuestraInfo({ output, input, toro: { ...toro, razaNombre } });
        }
      } catch (err) {
        setError("No se pudo cargar el informe.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleExportPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 1,
      filename: `informe_produccion_${id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (loading) return <div className="container p-4">Cargando informe...</div>;
  if (error) return <div className="container p-4 text-danger">{error}</div>;
  if (!registros.length)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "70vh;" }}
      >
        <div
          className="text-center p-5 rounded-3 shadow"
          style={{ backgroundColor: "#f8f9fa", maxWidth: "600px;" }}
        >
          <i className="bi bi-file-earmark-excel fs-1 text-muted mb-3"></i>
          <h2 className="text-secondary mb-3">
            Aún no hay registros para este reporte
          </h2>
          <p className="text-muted">
            Cuando existan datos disponibles, aparecerán aquí automáticamente.
          </p>
          <button className="btn btn-outline-primary mt-2">Actualizar</button>
        </div>
      </div>
    );

  // Calcular totales
  const total_gi = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.gi) || 0),
    0
  );
  const total_gii = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.gii) || 0),
    0
  );
  const total_giii = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.giii) || 0),
    0
  );
  const total_viables = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.viables) || 0),
    0
  );
  const total_otros = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.otros) || 0),
    0
  );
  const total_total_oocitos = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.total_oocitos) || 0),
    0
  );
  const total_ctv = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.ctv) || 0),
    0
  );
  const total_clivados = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.clivados) || 0),
    0
  );
  const total_prevision = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.prevision) || 0),
    0
  );
  const total_empaque = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.empaque) || 0),
    0
  );
  const total_vt_dt = registros.reduce(
    (sum, reg) => sum + (parseInt(reg.vt_dt) || 0),
    0
  );
  const total_total = total_prevision + total_empaque + total_vt_dt;
  const porcentaje_final =
    total_ctv > 0 ? Math.round((total_total / total_ctv) * 100) : 0;

  const donantes = Array.from(new Set(registros.map((r) => r.donante_nombre)));
  const clivadosData = donantes.map((donante) => {
    const reg = registros.find((r) => r.donante_nombre === donante);
    return reg ? parseInt(reg.porcentaje_cliv) : 0;
  });
  const embrionesData = donantes.map((donante) => {
    const reg = registros.find((r) => r.donante_nombre === donante);
    if (!reg) return 0;
    const total =
      (parseFloat(reg.prevision) || 0) +
      (parseFloat(reg.empaque) || 0) +
      (parseFloat(reg.vt_dt) || 0);
    const ctv = parseFloat(reg.ctv) || 1;
    return Math.round((total / ctv) * 100);
  });
  const chartData = {
    labels: donantes,
    datasets: [
      {
        label: "% Clivados",
        data: clivadosData,
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "% Embriones",
        data: embrionesData,
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
          text: "Porcentaje (%)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
      x: {
        ticks: {
          font: { size: 11 },
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
        text: "Comparativa % Clivados vs % Embriones por Donante",
      },
    },
  };

  console.log({ data: registros, production: production });
  return (
    <div className="container-fluid">
      <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left me-1"></i>
        Volver a la lista
      </button>

      <div className="detailed-report" ref={reportRef}>
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="text-center mb-4">
              INFORME PRODUCCIÓN DE EMBRIONES BOVINOS OPU/FIV - BIOGENETIC
              IN-VITRO SAS
            </h3>
            <div className="row">
              <div className="col-md-12">
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th>CLIENTE</th>
                      <td>{currentUserReport.full_name}</td>
                      <th>LUGAR</th>
                      <td>{production.lugar}</td>
                      <th>HORA INICIO OPU</th>
                      <td>{production.hora_inicio}</td>
                      <th>ENVASE</th>
                      <td>{production.envase}</td>
                    </tr>
                    <tr>
                      <th>FECHA OPU</th>
                      <td>{production.fecha_opu}</td>
                      <th>FINCA</th>
                      <td>{production.finca}</td>
                      <th>HORA FINAL OPU</th>
                      <td>{production.hora_final}</td>
                      <th>FECHA DE TRANSFERENCIA</th>
                      <td>{handleDate(production.fecha_opu)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive mb-4">
          <table className="table table-bordered">
            <thead>
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
                <th>CIV</th>
                <th>CLIVADOS</th>
                <th>% CLIV.</th>
                <th style={{ backgroundColor: "red", color: "white" }}>
                  PREVISIÓN
                </th>
                <th>% PREV</th>
                <th style={{ backgroundColor: "blue", color: "white" }}>
                  EMPAQUE
                </th>
                <th>% EMP</th>
                <th style={{ backgroundColor: "green", color: "white" }}>
                  VT/DT
                </th>
                <th>% VT/DT</th>
                <th>TOTAL</th>
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
                <tr key={registro.id}>
                  <td>{index + 1}</td>
                  <td>{registro.donante_code}</td>
                  <td>{registro.race}</td>
                  <td>{registro.toro_nombre}</td>
                  <td>{registro.gi}</td>
                  <td>{registro.gii}</td>
                  <td>{registro.giii}</td>
                  <td>{registro.viables}</td>
                  <td>{registro.otros}</td>
                  <td>{registro.total_oocitos}</td>
                  <td>{registro.ctv}</td>
                  <td>{registro.clivados}</td>
                  <td>{registro.porcentaje_cliv}</td>
                  <td>{registro.prevision}</td>
                  <td>{registro.porcentaje_prevision}</td>
                  <td>{registro.empaque}</td>
                  <td>{registro.porcentaje_empaque}</td>
                  <td>{registro.vt_dt}</td>
                  <td>{registro.porcentaje_vtdt}</td>
                  <td>
                    {registro.empaque + registro.vt_dt + registro.prevision}
                  </td>
                  <td>{`${Math.round(
                    (parseFloat(
                      registro.empaque + registro.vt_dt + registro.prevision
                    ) /
                      registro.ctv) *
                      100
                  )}%`}</td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                <td colSpan="4">Totales</td>
                <td>{total_gi}</td>
                <td>{total_gii}</td>
                <td>{total_giii}</td>
                <td>{total_viables}</td>
                <td>{total_otros}</td>
                <td>{total_total_oocitos}</td>
                <td>{total_ctv}</td>
                <td>{total_clivados}</td>
                <td></td>
                <td>{total_prevision}</td>
                <td></td>
                <td>{total_empaque}</td>
                <td></td>
                <td>{total_vt_dt}</td>
                <td></td>
                <td>{total_total}</td>
                <td>{porcentaje_final + "%"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {muestraInfo && (
          <div className="alert alert-info mt-3">
            <h5 className="mb-2">
              <i className="bi bi-droplet me-2"></i>Información de la muestra
              utilizada
            </h5>
            <ul className="mb-0">
              <li>
                <b>Toro:</b> {muestraInfo.toro.name} (Registro:{" "}
                {muestraInfo.toro.register})
              </li>
              <li>
                <b>Raza:</b>{" "}
                {muestraInfo.toro.razaNombre ||
                  muestraInfo.toro.race_name ||
                  muestraInfo.toro.race_id}
              </li>
              <li>
                <b>Cantidad utilizada:</b> {muestraInfo.output.quantity_output}
              </li>
              <li>
                <b>Cantidad recibida:</b> {muestraInfo.input.quantity_received}
              </li>
              <li>
                <b>Cantidad disponible:</b> {muestraInfo.input.total}
              </li>
              <li>
                <b>Fecha de la muestra:</b>{" "}
                {muestraInfo.input.created_at
                  ? new Date(muestraInfo.input.created_at).toLocaleDateString(
                      "es-CO"
                    )
                  : "N/A"}
              </li>
              {muestraInfo.output.remark && (
                <li>
                  <b>Observaciones:</b> {muestraInfo.output.remark}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
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

        {/* <div className="text-end mt-4 mb-4">
          <button 
            className="btn btn-primary"
            onClick={handleExportPDF}
          >
            <i className="bi bi-file-pdf me-2"></i>
            Exportar como PDF
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ReportDetails;

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
import { getProductionById, getBullsSummaryByProductionId } from "../Api/productionEmbrionary";
import { getUserById } from "../Api/users";
import { getOutputById, getOutputs } from "../Api/outputs";
import { getInputById } from "../Api/inputs";
import { getBull } from "../Api/bulls";
import { getRaceById } from "../Api/races";
import { descargarInformeProduccionPdf } from "../Api/informes";

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
  const [resumenToros, setResumenToros] = useState([]);
  const [downloading, setDownloading] = useState(false);

  const handleDate = (date) => {
    // Convertimos a objeto Date
    // console.log("-->>>>>>>>>>>>", date);
    const dateObj = new Date(date);
    // Sumamos 5 días
    dateObj.setDate(dateObj.getDate() + 5);
    // Formateamos nuevamente en formato YYYY-MM-DD
    return dateObj.toISOString().split("T")[0];
  };

  console.log("id", id);

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

  useEffect(() => {
    const fetchResumenToros = async () => {
      try {
        const resumen = await getBullsSummaryByProductionId(id);
        console.log('Resumen toros recibido:', resumen);
        setResumenToros(resumen);
      } catch (e) {
        setResumenToros([]);
        console.error('Error al cargar resumen de toros:', e);
      }
    };
    fetchResumenToros();
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

  const handleDownloadInformePdf = async () => {
    try {
      setDownloading(true);
      await descargarInformeProduccionPdf(id);
    } catch (e) {
      console.error('Error descargando informe PDF:', e);
      setError('No se pudo descargar el informe PDF');
    } finally {
      setDownloading(false);
    }
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
  // Etiquetas: una por cada fila
  const labels = registros.map((r, idx) => r.donante_nombre || `${r.toro_nombre} - ${r.donante_code}`);

  // Dataset de % Clivados (porcentaje_cliv)
  const clivadosData = registros.map(r =>
    parseFloat((r.porcentaje_cliv || "0").toString().replace("%", ""))
  );

  // Dataset de % Total Producción (porcentaje_total_embriones o calculado)
  const totalData = registros.map(r => {
    if (r.porcentaje_prevision) {
      return parseFloat((r.porcentaje_prevision || "0").toString().replace("%", ""));
    }
    // const total = (parseFloat(r.prevision) || 0) + (parseFloat(r.empaque) || 0) + (parseFloat(r.vt_dt) || 0);
    // const ctv = parseFloat(r.ctv) || 1;
    // return Math.round((total / ctv) * 100);
  });

  console.log("totalData", totalData);

  const chartData = {
    labels,
    datasets: [
      {
        label: "% Clivados",
        data: clivadosData,
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "% Total Producción",
        data: totalData,
        backgroundColor: "rgba(44, 44, 160, 0.8)",
      },
    ],
  };

  console.log("chartData", chartData);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
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

  // console.log({ data: registros, production: production });
  return (
    <div className="container-xl py-4" style={{ fontSize: '0.97rem', minHeight: '100vh' }}>
      <div className="d-flex align-items-center mb-3 mt-3 gap-2">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i>
          Volver a la lista
        </button>
        <button className="btn btn-primary" onClick={handleDownloadInformePdf} disabled={downloading}>
          {downloading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Descargando...
            </>
          ) : (
            <>
              <i className="bi bi-download me-1"></i>
              Descargar informe PDF
            </>
          )}
        </button>
      </div>

      <div className="mx-auto" style={{ maxWidth: 1600 }} ref={reportRef}>
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body p-4">
            <h3 className="text-center mb-4" style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '0.5px' }}>
              INFORME PRODUCCIÓN DE EMBRIONES BOVINOS OPU/FIV - BIOGENETIC IN-VITRO SAS
            </h3>
            <div className="table-responsive mb-0">
              <table className="table table-bordered mb-0" style={{ fontSize: '0.98rem' }}>
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

        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body p-3">
            <div className="table-responsive">
              <table className="table table-bordered mb-0" style={{ fontSize: '0.97rem', minWidth: 900 }}>
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
                      <td className="text-center">{index + 1}</td>
                      <td className="text-center">{registro.donante_code}</td>
                      <td className="text-center">{registro.race}</td>
                      <td className="text-center">{registro.toro_nombre}</td>
                      <td className="text-center">{registro.gi}</td>
                      <td className="text-center">{registro.gii}</td>
                      <td className="text-center">{registro.giii}</td>
                      <td className="text-center">{registro.viables}</td>
                      <td className="text-center">{registro.otros}</td>
                      <td className="text-center">{registro.total_oocitos}</td>
                      <td className="text-center">{registro.ctv}</td>
                      <td className="text-center">{registro.clivados}</td>
                      <td className="text-center">{registro.porcentaje_cliv}</td>
                      <td className="text-center">{registro.prevision}</td>
                      <td className="text-center">{registro.porcentaje_prevision}</td>
                      <td className="text-center">{registro.empaque}</td>
                      <td className="text-center">{registro.porcentaje_empaque}</td>
                      <td className="text-center">{registro.vt_dt}</td>
                      <td className="text-center">{registro.porcentaje_vtdt}</td>
                      <td className="text-center">
                        { registro.prevision}
                      </td>
                      <td className="text-center">{`${Math.round((registro.prevision * 100) / (registro.ctv === 0 ? 1 : registro.ctv ) )}%`}</td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                    <td colSpan="4" className="text-center">Totales</td>
                    <td className="text-center">{total_gi}</td>
                    <td className="text-center">{total_gii}</td>
                    <td className="text-center">{total_giii}</td>
                    <td className="text-center">{total_viables}</td>
                    <td className="text-center">{total_otros}</td>
                    <td className="text-center">{total_total_oocitos}</td>
                    <td className="text-center">{total_ctv}</td>
                    <td className="text-center">{total_clivados}</td>
                    <td className="text-center">{`${Math.round((total_clivados * 100) / total_ctv)}%`}</td>
                    <td className="text-center">{total_prevision}</td>
                    <td className="text-center">{`${Math.round((total_prevision * 100) / total_ctv)}%`}</td>
                    <td className="text-center">{total_empaque}</td>
                    <td className="text-center">{`${Math.round((total_empaque * 100) / total_ctv)}%`}</td>
                    <td className="text-center">{total_vt_dt}</td>
                    <td className="text-center">{`${Math.round((total_vt_dt * 100) / total_ctv)}%`}</td>
                    <td className="text-center">{total_prevision}</td>
                    <td className="text-center">{`${Math.round(( total_prevision * 100) / total_ctv)}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


         {/* Observaciones de la producción */}
         {production && production.observacion && production.observacion.trim() !== '' && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-body p-4">
              <h4 className="text-center mb-3" style={{ fontWeight: 600, letterSpacing: '0.5px', textTransform:"uppercase"}}>Observaciones</h4>
              <div className="mx-auto" style={{ maxWidth: 900 }}>
                <div className="bg-light rounded-3 p-3" style={{ whiteSpace: 'pre-line', fontSize: '1.05rem', color: '#333' }}>
                  {production.observacion}
                </div>
              </div>
            </div>
          </div>
        )}

        {console.log('Render resumenToros:', resumenToros)}
        {resumenToros && resumenToros.length > 0 ? (
          <div className="card mb-4 shadow-sm border-0" style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
            <div className="card-body p-3">
              <h4 className="mb-3 text-center" style={{ fontSize: '1.15rem', fontWeight: 600, letterSpacing: '0.5px', color: '#222', textTransform:"uppercase"}}>
                Resumen de Salidas de semen
              </h4>
              <div className="table-responsive">
                <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: '0.97rem', minWidth: 700 }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ padding: '10px 18px' }}>Toro</th>
                      <th style={{ padding: '10px 18px' }}>Raza</th>
                      <th style={{ padding: '10px 18px' }}>Registro</th>
                      <th style={{ padding: '10px 18px' }}>Cantidad trabajada</th>
                      <th style={{ padding: '10px 18px' }}>#N° Donantes</th>
                      <th style={{ padding: '10px 18px' }}>Cultivados</th>
                      <th style={{ padding: '10px 18px' }}>Producción total</th>
                      <th style={{ padding: '10px 18px' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenToros.map((t, idx) => (
                      <tr key={t.nombre_toro + idx}>
                        <td style={{ padding: '8px 18px' }} className="text-center">{t.nombre_toro}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{t.raza_toro}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{t.numero_registro}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{parseFloat(t.cantidad_semen_trabajada).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{t.total_donadoras}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{parseFloat(t.cantidad_total_ctv).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{t.produccion_total}</td>
                        <td style={{ padding: '8px 18px' }} className="text-center">{parseFloat(t.porcentaje).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info mt-4 mb-4">
            <i className="bi bi-info-circle me-2"></i>
            No hay datos de toros para mostrar (verifica la consola para más información).
          </div>
        )}

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

        <div className="card mb-4 shadow-sm border-0" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
          <div className="card-body p-3">
            <div className="d-flex flex-column align-items-center">
              <div className="table-responsive" style={{ width: '100%' }}>
                <div
                  className="chart-container"
                  style={{
                    height: `${250 * 1.2}px`,
                    minWidth: '320px',
                    maxWidth: 900,
                    background: '#fff',
                    width: '100%',
                    margin: '0 auto'
                  }}
                >
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

export default ReportDetails;

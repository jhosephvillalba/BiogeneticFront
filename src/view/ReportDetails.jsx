import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

import { getOpusByProduction } from '../Api/opus';
import { getProductionById } from '../Api/productionEmbrionary'; 
import { getUserById } from '../Api/users'; 


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
  const [registros, setRegistros] = useState([]);
  const [production, setProduction] = useState(null);
  const [currentUserReport, setCurrentUserReport ] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOpusByProduction(id);
        const dataProduction = await getProductionById(id); 

        setRegistros(data);
        console.log({data:data})
        setProduction(dataProduction); 

        const userReport = await getUserById(dataProduction.cliente_id); 

        setCurrentUserReport(userReport); 

      } catch (err) {
        setError('No se pudo cargar el informe.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="container p-4">Cargando informe...</div>;
  if (error) return <div className="container p-4 text-danger">{error}</div>;
  if (!registros.length) return (<div className="d-flex justify-content-center align-items-center" style={{height: "70vh;"}}>
  <div className="text-center p-5 rounded-3 shadow" style={{backgroundColor: "#f8f9fa", maxWidth: "600px;"}}>
    <i className="bi bi-file-earmark-excel fs-1 text-muted mb-3"></i>
    <h2 className="text-secondary mb-3">Aún no hay registros para este reporte</h2>
    <p className="text-muted">Cuando existan datos disponibles, aparecerán aquí automáticamente.</p>
    <button className="btn btn-outline-primary mt-2">Actualizar</button>
  </div>
</div>); 


  const chartData = {
    labels: registros.map(r => r.donante_nombre),
    datasets: [
      {
        label: '% CLIVADOS',
        data: registros.map(r => parseInt(r.porcentaje_cliv)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: '% EMBRIONES',
        data: registros.map(r => parseInt(r.porcentaje_total_embriones)),
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
          font: { size: 11 }
        }
      },
      x: {
        ticks: {
          font: { size: 11 }
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

          console.log({data: registros, production: production})
  return (
    <div className="container-fluid">
      <button 
        className="btn btn-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left me-1"></i>
        Volver a la lista
      </button>

      <div className="detailed-report">
        <div className="card mb-4">
          <div className="card-body">
            <h3 className="text-center mb-4">
              INFORME PRODUCCIÓN DE EMBRIONES BOVINOS OPU/FIV - BIOGENETIC IN-VITRO SAS
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
                      <td>{production.fecha_transferencia}</td>
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
                <th colSpan="3" className="text-center">OOCITOS VIABLES</th>
                <th>VIABLES</th>
                <th>OTROS</th>
                <th>TOTAL</th>
                <th>CIV</th>
                <th>CLIVADOS</th>
                <th>% CLIV.</th>
                <th style={{backgroundColor:"red", color:"white"}}>PREVISIÓN</th>
                <th>% PREV</th>
                <th style={{backgroundColor:"blue", color:"white"}}>EMPAQUE</th>
                <th>% EMP</th>
                <th style={{backgroundColor:"green", color:"white"}}>VT/DT</th>
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
                  <td>{registro.empaque + registro.vt_dt + registro.prevision }</td>
                  <td>{`${Math.round((parseFloat(registro.empaque + registro.vt_dt + registro.prevision ) / registro.ctv)) * 100}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
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

export default ReportDetails;

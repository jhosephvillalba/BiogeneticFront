import React, { useState, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ProfileView from "./view/Profile";
import BreedManagement from "./view/Races";
import Login from "./view/Login";
import Inventory from "./view/Inventary";
import Clients from "./view/Clients";
import Veterinary from "./view/Veterinary";
import { ProtectedRoute } from "./Components/ProtetedRoute";
import Inputs from "./view/Inputs";
import InputsDetails from "./view/InputsDetails";
import Outputs from './view/Outputs';
import OutputsDetails from './view/OutputsDetails';
import ClientDetails from "./view/ClientDetails";
import Admins from "./view/Admins";
import Bulls from "./view/Bulls";
import BullEdit from "./view/BullEdit";
import VeterinaryDetails from "./view/VeterinaryDetails";
import AdminDetails from "./view/AdminDetails";
import EmbryoProduction from "./view/EmbryoProduction";
import OpusSummary from "./view/OpusSummary";
import Reports from "./view/Reports";
// import DetailReport from "./view/DetailReport";
import ReportDetails from "./view/ReportDetails";
import api from './Api/index.js';
import BullsByClient from "./view/BullByClient.jsx";
import TransferReport from "./view/TransferReport.jsx";
import TransferSummary from "./view/TransferSummary.jsx";
import TransferReportDetail from "./view/TransferReportDetail.jsx";
import Calendar from "./view/Calendar.jsx";
import "./App.css";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Función para actualizar el usuario en el estado y localStorage
  const updateUser = (userData) => {
    console.log("Actualizando datos de usuario:", userData);
    // Guardar los datos completos del usuario en localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    // Actualizar el estado
    setUser(userData);
  };

  // Función para alternar la visibilidad del sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Actualizar cómo detectamos el rol del usuario
  const checkUserRole = (user) => {
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return 'unknown';
    }
    
    // Buscar roles por prioridad (admin > user > client)
    if (user.roles.some(role => role.id === 1 || role.name === 'Admin')) {
      return 'admin';
    } else if (user.roles.some(role => role.id === 2 || role.name === 'User')) {
      return 'user';
    } else if (user.roles.some(role => role.id === 3 || role.name === 'Client')) {
      return 'client';
    } else {
      return 'unknown';
    }
  };

  // Verificar autenticación una sola vez al montar
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (isMounted) {
          setLoading(false);
          if (location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);

        const userData = await api.auth.getCurrentUser();
        if (isMounted) {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');

        if (isMounted) {
          setUser(null);
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Redirecciones de rol sin bloquear la UI ni recargar entre rutas
  useEffect(() => {
    if (!user) return;

    const userRole = checkUserRole(user);
    if (location.pathname === '/' || location.pathname === '/login') {
      if (userRole === 'client') {
        navigate('/reports', { replace: true });
      } else if (userRole === 'admin' || userRole === 'user') {
        navigate('/inventory', { replace: true });
      }
    }

    if (userRole === 'client' && location.pathname === '/inventory') {
      navigate('/reports', { replace: true });
    } else if ((userRole === 'admin' || userRole === 'user') && location.pathname === '/reports') {
      navigate('/inventory', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (loading) {
    // Muestra una pantalla de carga mientras verificamos la sesión
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    let options = confirm("¿Desea cerrar sesión?");

    if (options) {
      api.auth.logout();
      localStorage.removeItem('userData');
      setUser(null);
      alert("Hasta pronto...");
      navigate('/login', { replace: true });
      return;
    }

    alert("Ok sigamos trabajando...");
  };

  // console.log("Datos del usuario en render:", user);

  // // Actualizar logs de depuración
  // console.log("Roles del usuario:", user?.roles);
  // console.log("Tipo de rol:", checkUserRole(user));

  // Verificar si el usuario es un cliente
  const userRole = checkUserRole(user);
  const isClient = userRole === 'client';
  console.log("isClient:", isClient); 
  // const isAdmin = userRole === 'admin';
  // const isVet = userRole === 'user';

  return (
    <div className="d-flex min-vh-100 min-vw-100">
      {/* Sidebar - Diferente según el rol */}
      {!isLoginPage && sidebarVisible && (
        <div className="sidebar d-flex flex-column justify-content-between text-white">
          {/* Parte superior - Perfil - Común para todos los usuarios */}
          <div className="sidebar-profile text-center">
            {user?.profile_image_url ? (
            <img
                src={user.profile_image_url}
              className="rounded-circle mb-3 border border-light"
              width="80"
              height="80"
              alt="Foto de perfil"
                style={{ objectFit: "cover" }}
            />
            ) : (
              <span className="placeholder rounded-circle d-inline-block bg-secondary mb-3 border border-light" style={{ width: 80, height: 80, lineHeight: "80px", textAlign: "center", fontSize: "2rem", color: "#fff" }}>
                <i className="bi bi-person" />
              </span>
            )}
            <h5 className="mb-0">{user?.full_name || user?.name || "Usuario"}</h5>
            <small className="text-muted">{user?.specialty || user?.email || "Usuario"}</small>
          </div>

          {/* Navegación - Condicional según el rol */}
          {isClient ? (
            // Navegación para clientes
            <nav className="sidebar-nav">
              <div className="sidebar-section">
                <div className="sidebar-title">Panel</div>
                <Link to="/user/inventary" className="sidebar-item">
                  <i className="bi bi-box-arrow-in-right me-2"></i> Inventario
                </Link>
                <Link to="/reports" className="sidebar-item">
                  <i className="bi bi-file-text me-2"></i> Informes
                </Link>
              </div>
              <div className="sidebar-section">
                <div className="sidebar-title">Cuenta</div>
                <Link to="/profile" className="sidebar-item">
                  <i className="bi bi-person-circle me-2"></i> Mi Perfil
                </Link>
              </div>
            </nav>
          ) : (
            // Navegación para administradores y otros roles
            <nav className="sidebar-nav">
              <div className="sidebar-section">
                <div className="sidebar-title">Inicio</div>
                <Link to="/inventory" className="sidebar-item">
                  <i className="bi bi-house me-2"></i> Inventario
                </Link>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Gestión</div>
                <Link to="/gestion/inputs" className="sidebar-item">
                  <i className="bi bi-box-arrow-in-right me-2"></i> Entradas
                </Link>
                <Link to="/bulls" className="sidebar-item">
                  <i className="bi bi-database me-2"></i> Toros
                </Link>
                <Link to="/embryo-production" className="sidebar-item">
                  <i className="bi bi-clipboard2-pulse me-2"></i> Producción Embrionaria
                </Link>
                <Link to="/transfer-report" className="sidebar-item">
                  <i className="bi bi-arrow-left-right me-2"></i> Transferencias
                </Link>
                <Link to="/transfer-summary" className="sidebar-item">
                  <i className="bi bi-list-check me-2"></i> Resumen de Transferencias
                </Link>
                <Link to="/opus-summary" className="sidebar-item">
                  <i className="bi bi-clipboard2-data me-2"></i> Resumen OPUS
                </Link>
                <Link to="/calendar" className="sidebar-item">
                  <i className="bi bi-calendar-event me-2"></i> Calendario de Actividades
                </Link>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Globales</div>
                <Link to="/global/race" className="sidebar-item">
                  <i className="bi bi-paw me-2"></i> Raza
                </Link>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Usuarios</div>
                <Link to="/admin/users" className="sidebar-item">
                  <i className="bi bi-shield-lock me-2"></i> Admin
                </Link>
                <Link to="/users/veterinary" className="sidebar-item">
                  <i className="bi bi-clipboard-pulse me-2"></i> Veterinarios
                </Link>
                <Link to="/users/clients" className="sidebar-item">
                  <i className="bi bi-person-badge me-2"></i> Clientes
                </Link>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-title">Cuenta</div>
                <Link to="/profile" className="sidebar-item">
                  <i className="bi bi-file-earmark-text me-2"></i> Perfil
                </Link>
              </div>
            </nav>
          )}

          {/* Botón de cerrar sesión - Común para todos los usuarios */}
          <div className="d-flex justify-content-center p-3">
            <button
              type="button"
              className="btn btn-outline-light w-100 sidebar-logout"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
          <div className="text-center p-3 small text-white-50">
            © 2025 Sistema BioGenetic
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ width: sidebarVisible ? "82%" : "100%", transition: "width 0.2s ease" }}>
        {!isLoginPage && (
          <nav className="navbar navbar-light bg-white shadow-sm d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={toggleSidebar}
                title={sidebarVisible ? "Ocultar menú" : "Mostrar menú"}
              >
                <i className={`bi ${sidebarVisible ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
              </button>
              <span className="navbar-brand mb-0 h1">Biogenetic</span>
            </div>
            <div className="d-flex align-items-center">
              <span className="text-muted me-3">
                {user?.full_name || user?.name || "Usuario"}
              </span>
            </div>
          </nav>
        )}

        <main className="flex-grow-1 overflow-auto route-fade">
          <div className="container-fluid">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? (
                  <Login setUser={setUser} />
                ) : (
                  <Navigate to={checkUserRole(user) === 'client' ? "/reports" : "/inventory"} replace />
                )} 
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route element={<ProtectedRoute user={user} />}>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/profile" element={<ProfileView updateUser={updateUser} />} />
                <Route path="/global/race" element={<BreedManagement />} />

                <Route path="/users/clients" element={<Clients />} />
                <Route path="/users/clients/:id" element={<ClientDetails />} />

                <Route path="/users/veterinary" element={<Veterinary />} />
                <Route path="/users/veterinary/new" element={<VeterinaryDetails />} />
                <Route path="/users/veterinary/:id" element={<VeterinaryDetails />} />
                
                <Route path="/gestion/inputs" element={<Inputs />} />
                <Route path="/gestion/inputs/:id" element={<InputsDetails />} />
                <Route path="/gestion/outputs" element={<Outputs />} />
                <Route path="/gestion/outputs/:id" element={<OutputsDetails />} />
                <Route path="/admin/users" element={<Admins />} />
                <Route path="/admin/users/:id" element={<AdminDetails />} />
                <Route path="/user/inventary" element={<BullsByClient />} />

                <Route path="/bulls" element={<Bulls />} />
                <Route path="/bulls/:id/edit" element={<BullEdit />} />
                <Route path="/embryo-production" element={<EmbryoProduction />} />
                <Route path="/opus-summary" element={<OpusSummary />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/transfer-report" element={<TransferReport />} />
                <Route path="/transfer-summary" element={<TransferSummary />} />
                <Route path="/transfer-detail/:id" element={<TransferReportDetail />} />
                <Route path="/reportdetails/:id" element={<ReportDetails />} />
                <Route path="/calendar" element={<Calendar />} />
              </Route>
              <Route path="*" element={<p>There's nothing here: 404!</p>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

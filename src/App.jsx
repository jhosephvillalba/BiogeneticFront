import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "./Components/ProtetedRoute";
import api from './Api/index.js';
import { AppProvider } from './context/AppContext';
import LoadingIndicator from './Components/LoadingIndicator';
import ErrorBoundary from './Components/ErrorBoundary';
import "./App.css";

// Importar componentes con lazy loading para mejorar rendimiento
const ProfileView = lazy(() => import("./view/Profile"));
const BreedManagement = lazy(() => import("./view/Races"));
const Login = lazy(() => import("./view/Login"));
const Inventory = lazy(() => import("./view/Inventary"));
const Clients = lazy(() => import("./view/Clients"));
const Veterinary = lazy(() => import("./view/Veterinary"));
const Inputs = lazy(() => import("./view/Inputs"));
const InputsDetails = lazy(() => import("./view/InputsDetails"));
const Outputs = lazy(() => import('./view/Outputs'));
const OutputsDetails = lazy(() => import('./view/OutputsDetails'));
const ClientDetails = lazy(() => import("./view/ClientDetails"));
const Admins = lazy(() => import("./view/Admins"));
const Bulls = lazy(() => import("./view/Bulls"));
const BullEdit = lazy(() => import("./view/BullEdit"));
const VeterinaryDetails = lazy(() => import("./view/VeterinaryDetails"));
const AdminDetails = lazy(() => import("./view/AdminDetails"));
const EmbryoProduction = lazy(() => import("./view/EmbryoProduction"));
const OpusSummary = lazy(() => import("./view/OpusSummary"));
const Reports = lazy(() => import("./view/Reports"));
const ReportDetails = lazy(() => import("./view/ReportDetails"));
const BullsByClient = lazy(() => import("./view/BullByClient.jsx"));
const TransferReport = lazy(() => import("./view/TransferReport.jsx"));
const TransferSummary = lazy(() => import("./view/TransferSummary.jsx"));
const TransferReportDetail = lazy(() => import("./view/TransferReportDetail.jsx"));
const Calendar = lazy(() => import("./view/Calendar.jsx"));

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

  // Redirecciones iniciales por rol (evitar navegar en cada cambio de ruta)
  useEffect(() => {
    if (!user) return;
    const userRole = checkUserRole(user);

    // Solo redirigir desde raíz o login al cargar sesión
    if (location.pathname === '/' || location.pathname === '/login') {
      if (userRole === 'client') {
        navigate('/reports', { replace: true });
      } else {
        navigate('/inventory', { replace: true });
      }
    }
  }, [user, navigate]);

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

  // Verificar si el usuario es un cliente
  const userRole = checkUserRole(user);
  const isClient = userRole === 'client';
  console.log("isClient:", isClient); 
  // const isAdmin = userRole === 'admin';
  // const isVet = userRole === 'user';

  const isActive = (path) => {
    const p = String(path || '');
    const cur = location.pathname || '';
    return cur === p || cur.startsWith(p + '/');
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <LoadingIndicator />
        <div className="d-flex min-vh-100 w-100">
        {/* Sidebar - Diferente según el rol */}
        {!isLoginPage && sidebarVisible && (
          <div key="main-sidebar" className="sidebar d-flex flex-column justify-content-between text-white">
            {/* Parte superior - Perfil - Común para todos los usuarios */}
            <div className="sidebar-profile text-center">
              {user?.profile_image_url ? (
              <img
                  key="user-avatar"
                  src={user.profile_image_url}
                className="rounded-circle mb-3 border border-light"
                width="80"
                height="80"
                alt="Foto de perfil"
                  style={{ objectFit: "cover" }}
              />
              ) : (
                <span key="default-avatar" className="placeholder rounded-circle d-inline-block bg-secondary mb-3 border border-light" style={{ width: 80, height: 80, lineHeight: "80px", textAlign: "center", fontSize: "2rem", color: "#fff" }}>
                  <i className="bi bi-person" />
                </span>
              )}
              <h5 className="mb-0">{user?.full_name || user?.name || "Usuario"}</h5>
              <small className="text-muted">{user?.specialty || user?.email || "Usuario"}</small>
            </div>

            {/* Navegación - Condicional según el rol */}
            {isClient ? (
              // Navegación para clientes
              <nav key="client-nav" className="sidebar-nav">
                <div className="sidebar-section">
                  <div className="sidebar-title">Panel</div>
                  <Link to="/user/inventary" className={`sidebar-item${isActive('/user/inventary') ? ' active' : ''}`}>
                    <i className="bi bi-box-arrow-in-right me-2"></i> Inventario
                  </Link>
                  <Link to="/reports" className={`sidebar-item${isActive('/reports') ? ' active' : ''}`}>
                    <i className="bi bi-file-text me-2"></i> Informes
                  </Link>
                </div>
                <div className="sidebar-section">
                  <div className="sidebar-title">Cuenta</div>
                  <Link to="/profile" className={`sidebar-item${isActive('/profile') ? ' active' : ''}`}>
                    <i className="bi bi-person-circle me-2"></i> Mi Perfil
                  </Link>
                </div>
              </nav>
            ) : (
              // Navegación para administradores y otros roles
              <nav key="admin-nav" className="sidebar-nav">
                <div className="sidebar-section">
                  <div className="sidebar-title">Inicio</div>
                  <Link to="/inventory" className={`sidebar-item${isActive('/inventory') ? ' active' : ''}`}>
                    <i className="bi bi-house me-2"></i> Inventario
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Gestión</div>
                  <Link to="/gestion/inputs" className={`sidebar-item${isActive('/gestion/inputs') ? ' active' : ''}`}>
                    <i className="bi bi-box-arrow-in-right me-2"></i> Entradas
                  </Link>
                  <Link to="/bulls" className={`sidebar-item${isActive('/bulls') ? ' active' : ''}`}>
                    <i className="bi bi-database me-2"></i> Toros
                  </Link>
                  <Link to="/calendar" className={`sidebar-item${isActive('/calendar') ? ' active' : ''}`}>
                    <i className="bi bi-calendar-event me-2"></i> Calendario de Actividades
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Producción</div>
                  <Link to="/embryo-production" className={`sidebar-item${isActive('/embryo-production') ? ' active' : ''}`}>
                    <i className="bi bi-clipboard2-pulse me-2"></i> Producción Embrionaria
                  </Link>
                  <Link to="/opus-summary" className={`sidebar-item${isActive('/opus-summary') ? ' active' : ''}`}>
                    <i className="bi bi-clipboard2-data me-2"></i> Resumen OPUS
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Transferencias</div>
                  <Link to="/transfer-report" className={`sidebar-item${isActive('/transfer-report') ? ' active' : ''}`}>
                    <i className="bi bi-arrow-left-right me-2"></i> Transferencias
                  </Link>
                  <Link to="/transfer-summary" className={`sidebar-item${isActive('/transfer-summary') ? ' active' : ''}`}>
                    <i className="bi bi-list-check me-2"></i> Resumen de Transferencias
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Globales</div>
                  <Link to="/global/race" className={`sidebar-item${isActive('/global/race') ? ' active' : ''}`}>
                    <i className="bi bi-paw me-2"></i> Raza
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Usuarios</div>
                  <Link to="/admin/users" className={`sidebar-item${isActive('/admin/users') ? ' active' : ''}`}>
                    <i className="bi bi-shield-lock me-2"></i> Admin
                  </Link>
                  <Link to="/users/veterinary" className={`sidebar-item${isActive('/users/veterinary') ? ' active' : ''}`}>
                    <i className="bi bi-clipboard-pulse me-2"></i> Veterinarios
                  </Link>
                  <Link to="/users/clients" className={`sidebar-item${isActive('/users/clients') ? ' active' : ''}`}>
                    <i className="bi bi-person-badge me-2"></i> Clientes
                  </Link>
                </div>

                <div className="sidebar-section">
                  <div className="sidebar-title">Cuenta</div>
                  <Link to="/profile" className={`sidebar-item${isActive('/profile') ? ' active' : ''}`}>
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
        <div key="main-content" className="d-flex flex-column flex-grow-1 overflow-hidden main-content">
          {!isLoginPage && (
            <nav key="top-navbar" className="navbar navbar-light bg-white shadow-sm d-flex justify-content-between align-items-center">
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

          <main className="flex-grow-1 overflow-auto">
            <div className="container-fluid">
              <Suspense fallback={
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              }>
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
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
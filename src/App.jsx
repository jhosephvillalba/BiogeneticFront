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
// import "./App.css";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para actualizar el usuario en el estado y localStorage
  const updateUser = (userData) => {
    console.log("Actualizando datos de usuario:", userData);
    // Guardar los datos completos del usuario en localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    // Actualizar el estado
    setUser(userData);
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

  useEffect(() => {
    let isMounted = true;
  
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
  
      if (!token) {
        if (isMounted) {
          setLoading(false);
          if (location.pathname !== '/login') {
            navigate('/login');
          }
        }
        return;
      }
  
      try {
        if (isMounted) setLoading(true);
  
        const userData = await api.auth.getCurrentUser();
        const userRole = checkUserRole(userData);
  
        if (isMounted) {
          setUser(userData);
  
          // Redirigir según el rol cuando estamos en la raíz o en login
          if (location.pathname === '/' || location.pathname === '/login') {
            if (userRole === 'client') {
              navigate('/reports');
            } else if (userRole === 'admin' || userRole === 'user') {
              navigate('/inventory');
            }
          }

          // Proteger rutas según el rol
          if (userRole === 'client' && location.pathname === '/inventory') {
            navigate('/reports');
          } else if ((userRole === 'admin' || userRole === 'user') && location.pathname === '/reports') {
            navigate('/inventory');
          }
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
  
        if (isMounted) {
          setUser(null);
          navigate('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
  
    checkAuth();
  
    return () => {
      isMounted = false;
    };
  }, [navigate, location.pathname]);

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
    let options = confirm("¿Desea cerrar sesíon?");

    if (options) {
      // Llamar a la función de logout correcta
      api.auth.logout();
      // Eliminar datos del usuario
      localStorage.removeItem('userData');
      setUser(null);
      alert("Hasta pronto...");
      return;
    }

    alert("Ok sigamos trabajando...");
  };

  console.log("Datos del usuario en render:", user);

  // Actualizar logs de depuración
  console.log("Roles del usuario:", user?.roles);
  console.log("Tipo de rol:", checkUserRole(user));

  // Verificar si el usuario es un cliente
  const userRole = checkUserRole(user);
  const isClient = userRole === 'client';
  console.log("isClient:", isClient); 
  // const isAdmin = userRole === 'admin';
  // const isVet = userRole === 'user';

  return (
    <div className="d-flex min-vh-100 min-vw-100">
      {/* Sidebar - Diferente según el rol */}
      {!isLoginPage && (
        <div
          className="bg-dark text-white d-flex flex-column justify-content-between"
          style={{ width: "20%", minWidth: "250px", flexShrink: 0 }}
        >
          {/* Parte superior - Perfil - Común para todos los usuarios */}
          <div className="p-4 text-center">
            <img
              src={user?.photo || "https://randomuser.me/api/portraits/men/32.jpg"}
              className="rounded-circle mb-3 border border-light"
              width="80"
              height="80"
              alt="Foto de perfil"
            />
            <h5 className="mb-0">{user?.full_name || user?.name || "Usuario"}</h5>
            <small className="text-muted">{user?.specialty || user?.email || "Usuario"}</small>
          </div>

          {/* Navegación - Condicional según el rol */}
          {isClient ? (
            // Navegación para clientes
            <nav className="nav flex-column px-3 align-items-center">
              {/* <Link to="/bulls" className="nav-link text-white">
                <i className="bi bi-cow me-2"></i> Toros
              </Link> */}
              
              <Link to="/reports" className="nav-link text-white">
                <i className="bi bi-file-text me-2"></i> Informes
              </Link>
              
              <Link to="/profile" className="nav-link text-white">
                <i className="bi bi-person-circle me-2"></i> Mi Perfil
              </Link>
            </nav>
          ) : (
            // Navegación para administradores y otros roles
          <nav className="nav flex-column px-3 align-items-center">
            <Link to="/inventory" className="nav-link text-white">
              <i className="bi bi-house me-2"></i> Inventario
            </Link>

            <div className="dropdown">
              <button
                className="btn dropdown-toggle text-white"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-paw me-2"></i> Gestión
              </button>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li>
                  <Link to="/gestion/inputs" className="nav-link text-white">
                      <i className="bi bi-box-arrow-in-right me-2"></i> Entradas
                    </Link>
                  </li>
                  {/* <li>
                    <Link to="/gestion/outputs" className="nav-link text-white">
                      <i className="bi bi-box-arrow-right me-2"></i> Salidas
                    </Link>
                  </li> */}
                  <li>
                    <Link to="/bulls" className="nav-link text-white">
                      <i className="bi bi-database me-2"></i> Toros
                  </Link>
                </li>
                <li>
                    <Link to="/embryo-production" className="nav-link text-white">
                      <i className="bi bi-clipboard2-pulse me-2"></i> Producción Embrionaria
                  </Link>
                </li>
                <li>
                    <Link to="/opus-summary" className="nav-link text-white">
                      <i className="bi bi-clipboard2-data me-2"></i> Resumen OPUS
                  </Link>
                </li>
              </ul>
            </div>

            <div className="dropdown">
              <button
                className="btn dropdown-toggle text-white"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-paw me-2"></i> Globales
              </button>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li>
                  <Link to="/global/race" className="nav-link text-white">
                    <i className="bi bi-paw me-2"></i> Raza
                  </Link>
                </li>
              </ul>
            </div>

            <div className="dropdown">
              <button
                className="btn dropdown-toggle text-white"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                  <i className="bi bi-people me-2"></i> Usuarios
              </button>
              <ul className="dropdown-menu dropdown-menu-dark">
                <li>
                    <Link to="/admin/users" className="nav-link text-white">
                      <i className="bi bi-shield-lock me-2"></i> Admin
                  </Link>
                </li>
                <li>
                  <Link to="/users/veterinary" className="nav-link text-white">
                      <i className="bi bi-clipboard-pulse me-2"></i> Veterinarios
                    </Link>
                  </li>
                  <li>
                    <Link to="/users/clients" className="nav-link text-white">
                      <i className="bi bi-person-badge me-2"></i> Clientes
                  </Link>
                </li>
              </ul>
            </div>

            <Link to="/profile" className="nav-link text-white">
              <i className="bi bi-file-earmark-text me-2"></i> Perfil
            </Link>
          </nav>
          )}

          {/* Botón de cerrar sesión - Común para todos los usuarios */}
          <div className="d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
          <div className="text-center p-3 small text-white">
            © 2025 Sistema BioGenetic
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="d-flex flex-column flex-grow-1 overflow-hidden">
        {!isLoginPage && (
          <nav className="navbar navbar-light bg-white shadow-sm">
            <div className="container-fluid">
              <span className="navbar-brand mb-0 h1">Biogenetic</span>
            </div>
          </nav>
        )}

        <main className="flex-grow-1 p-4 overflow-auto">
          <div className="container-fluid">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? (
                  <Login setUser={setUser} />
                ) : (
                  <Navigate to={checkUserRole(user) === 'client' ? "/reports" : "/inventory"} />
                )} 
              />
              <Route path="/" element={<Navigate to="/login" />} />
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
                <Route path="/bulls" element={<Bulls />} />
                <Route path="/bulls/:id/edit" element={<BullEdit />} />
                <Route path="/embryo-production" element={<EmbryoProduction />} />
                <Route path="/opus-summary" element={<OpusSummary />} />
                <Route path="/reports" element={<Reports />} />
                {/* <Route path="/reports/:id" element={<DetailReport />} /> */}
                <Route path="/reportdetails/:id" element={<ReportDetails />} />
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

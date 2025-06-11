import { Navigate } from 'react-router-dom';
import Dashboard from './view/Dashboard';
import Profile from './view/Profile';
import Bulls from './view/Bulls';
import Inputs from './view/Inputs';
import Outputs from './view/Outputs';
import Users from './view/Users';
import EmbryoProduction from './view/EmbryoProduction';
import OpusSummary from './view/OpusSummary';

const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
    showInMenu: false
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    name: 'Dashboard',
    icon: 'bi bi-speedometer2',
    showInMenu: true,
    requiredRoles: ['admin', 'client']
  },
  {
    path: '/profile',
    element: <Profile />,
    name: 'Mi Perfil',
    icon: 'bi bi-person-circle',
    showInMenu: true,
    requiredRoles: ['admin', 'client']
  },
  {
    path: '/bulls',
    element: <Bulls />,
    name: 'Toros',
    icon: 'bi bi-database-fill',
    showInMenu: true,
    requiredRoles: ['admin']
  },
  {
    path: '/inputs',
    element: <Inputs />,
    name: 'Entradas',
    icon: 'bi bi-box-arrow-in-right',
    showInMenu: true,
    requiredRoles: ['admin']
  },
  {
    path: '/outputs',
    element: <Outputs />,
    name: 'Salidas',
    icon: 'bi bi-box-arrow-right',
    showInMenu: true,
    requiredRoles: ['admin']
  },
  {
    path: '/users',
    element: <Users />,
    name: 'Usuarios',
    icon: 'bi bi-people-fill',
    showInMenu: true,
    requiredRoles: ['admin']
  },
  {
    path: '/embryo-production',
    element: <EmbryoProduction />,
    name: 'Producción Embrionaria',
    icon: 'bi bi-clipboard2-pulse',
    showInMenu: true,
    requiredRoles: ['admin']
  },
  {
    path: '/opus-summary',
    element: <OpusSummary />,
    name: 'Resumen OPUS',
    icon: 'bi bi-clipboard2-data',
    showInMenu: false,
    requiredRoles: ['admin']
  }
];

export default routes; 
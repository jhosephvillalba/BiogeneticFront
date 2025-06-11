import * as authApi from './auth';
import * as bullsApi from './bulls';
import * as racesApi from './races';
import * as sexesApi from './sexes';
import * as usersApi from './users';
import * as rolesApi from './roles';
import * as inputsApi from './inputs';
import * as outputsApi from './outputs';
import * as opusApi from './opus';

// No es necesario crear otra instancia de axios aquí,
// ya que estamos usando la configurada en axios.js

// Exportaciones nombradas
export { 
  authApi, 
  bullsApi, 
  racesApi, 
  sexesApi, 
  usersApi, 
  rolesApi, 
  inputsApi, 
  outputsApi,
  opusApi
};

// Exportación por defecto (todas las APIs juntas)
const api = {
  auth: authApi,
  bulls: bullsApi,
  inputs: inputsApi,
  outputs: outputsApi,
  users: usersApi,
  races: racesApi,
  sexes: sexesApi,
  roles: rolesApi,
  opus: opusApi
};

export default api;
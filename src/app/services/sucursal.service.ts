import { AgentesBackendService } from "./agente.service";

/**
 * Servicio backend del módulo Sucursal.
 * Delega al servicio de agentes las operaciones compartidas.
 * A medida que sucursal tenga lógica propia, se reemplazan los métodos aquí.
 */
export const SucursalBackendService = {
  getListPrealert:          AgentesBackendService.getListPrealert.bind(AgentesBackendService),
  getIdPrealert:            AgentesBackendService.getIdPrealert.bind(AgentesBackendService),
  getSedes:                 AgentesBackendService.getSedes.bind(AgentesBackendService),
  insertPrealert:           AgentesBackendService.insertPrealert.bind(AgentesBackendService),
  updatePrealertNombre:     AgentesBackendService.updatePrealertNombre.bind(AgentesBackendService),
  deletePrealert:           AgentesBackendService.deletePrealert.bind(AgentesBackendService),
  getSerialsByPrealerta:    AgentesBackendService.getSerialsByPrealerta.bind(AgentesBackendService),
  getCajasByPrealerta:      AgentesBackendService.getCajasByPrealerta.bind(AgentesBackendService),
  getSerialsPorCaja:        AgentesBackendService.getSerialsPorCaja.bind(AgentesBackendService),
  insertPrealertSerialBatch:AgentesBackendService.insertPrealertSerialBatch.bind(AgentesBackendService),
  desempacarSeriales:       AgentesBackendService.desempacarSeriales.bind(AgentesBackendService),
  eliminarSerial:           AgentesBackendService.eliminarSerial.bind(AgentesBackendService),
};

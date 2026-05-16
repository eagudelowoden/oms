import { AgentesBackendService } from "./agente.service";
import { execQuery } from "@/lib/db-helpers";

/**
 * Servicio backend del módulo Sucursal.
 * Delega al servicio de agentes las operaciones compartidas.
 * A medida que sucursal tenga lógica propia, se reemplazan los métodos aquí.
 */
export const SucursalBackendService = {
  /** Lista de prealertas incluyendo ciudad (join con Sede) */
  async getListPrealert() {
    const rows = await execQuery<{
      Id: number; Nombre: string | null; Ciudad: string | null;
      Fecha: Date | null; Estado: string | null; UsuarioId: number | null;
      UsuarioNombre: string | null; TipoOrigenId: number | null; OrigenId: number | null;
    }>(`
      SELECT p.Id, p.Nombre,
             s.Nombre AS Ciudad,
             p.Fecha, p.Estado,
             p.UsuarioId, u.nombres AS UsuarioNombre,
             p.TipoOrigenId, p.OrigenId
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
      ORDER BY p.Fecha DESC
    `);
    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toISOString() : null,
      estado: r.Estado ?? "Pendiente",
      usuarioId: r.UsuarioId ?? undefined,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      tipoOrigenId: r.TipoOrigenId ?? undefined,
      origenId: r.OrigenId ?? undefined,
    }));
  },
  /**
   * Para cada serial de la prealerta que no tenga CodigoSap,
   * busca el serial en la tabla CodigoSap (campo `codigo`).
   * Si lo encuentra, actualiza CodigoSap y Descripcion en PrealertaSerial.
   * Retorna cuántos registros fueron actualizados.
   */
  async sincronizarConCodigoSap(prealertaId: number): Promise<{ actualizados: number }> {
    // Seriales sin SAP code
    const seriales = await execQuery<{ Id: number; Serial: string }>(
      `SELECT Id, Serial FROM PrealertaSerial
       WHERE PrealertaId = @prealertaId
         AND (CodigoSap IS NULL OR CodigoSap = '')
         AND (Serial IS NOT NULL AND Serial <> '')`,
      { prealertaId },
    );

    if (seriales.length === 0) return { actualizados: 0 };

    // Cargar tabla CodigoSap (codigo → Descripcion)
    const sapMap = await AgentesBackendService.getCodigosSap();

    let actualizados = 0;
    for (const row of seriales) {
      const desc = sapMap.get(row.Serial.trim());
      if (desc !== undefined) {
        await execQuery(
          `UPDATE PrealertaSerial
              SET CodigoSap = @codigo, Descripcion = @descripcion
            WHERE Id = @id`,
          { id: row.Id, codigo: row.Serial.trim(), descripcion: desc },
        );
        actualizados++;
      }
    }

    return { actualizados };
  },

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

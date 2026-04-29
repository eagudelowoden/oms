import sql from 'mssql';
import { getDBConnection } from '../../../../../lib/db';

export const PrealertaBackendService = {
  // Consume pa_InsertPrealert
  async insertPrealert(data: {
    nombre: string,
    tipoOrigenId: number,
    origenId: number,
    guia: string,
    usuarioId: number,
    idResponsable: number,
    estado: string
  }) {
    const pool = await getDBConnection();
    await pool.request()
      .input('Nombre', sql.VarChar(50), data.nombre)
      .input('TipoOrigenId', sql.Int, data.tipoOrigenId)
      .input('OrigenId', sql.Int, data.origenId)
      .input('Guia', sql.VarChar(30), data.guia)
      .input('UsuarioId', sql.Int, data.usuarioId)
      .input('Fecha', sql.DateTime, new Date()) // Fecha actual
      .input('IdResponsable', sql.Int, data.idResponsable)
      .input('Estado', sql.VarChar(20), data.estado)
      .execute('pa_InsertPrealert');
    return { success: true };
  },

  // Consume pa_GetListPrealert
async getListPrealert(): Promise<string[]> {
    try {
      const pool = await getDBConnection();
      const result = await pool.request().execute('pa_GetListPrealert');
      
      // Si no hay datos, retornamos array vacío en lugar de romper el código
      if (!result.recordset) return [];

      // Validamos tanto 'nombre' como 'Nombre' por si SQL lo devuelve distinto
      return result.recordset.map(r => r.nombre || r.Nombre || "Sin Nombre");
    } catch (error) {
      console.error("Error en getListPrealert:", error);
      throw error;
    }
  },

  // Consume pa_GetIdPrealert
  async getIdPrealert(nombre: string): Promise<number | null> {
    const pool = await getDBConnection();
    const result = await pool.request()
      .input('Nombre', sql.VarChar(50), nombre)
      .execute('pa_GetIdPrealert');
    return result.recordset[0]?.Id || result.recordset[0]?.id || null;
  }
};
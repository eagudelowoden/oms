import sql from 'mssql';
import { getDBConnection } from '../../../../lib/db';

export const ClienteBackendService = {
  // Obtiene nombres de clientes (pa_GetListClient)
  async getListClient(usuarioId: number): Promise<string[]> {
    try {
      const pool = await getDBConnection();
      const result = await pool.request()
        // CAMBIO AQUÍ: Cambiamos 'Id' por 'UsuarioId' para que coincida con el SP
        .input('UsuarioId', sql.Int, usuarioId) 
        .execute('pa_GetListClient');

      return result.recordset.map(r => r.Nombre || r.nombre || Object.values(r)[0]);
    } catch (error) {
      console.error('Error en getListClient:', error);
      throw error;
    }
  },

  // Obtiene ID por nombre (pa_GetIdClient)
  async getIdClient(nombre: string): Promise<number | null> {
    try {
      const pool = await getDBConnection();
      const result = await pool.request()
        // Asegúrate que aquí el SP espere @nombre (minúscula) o cámbialo si es @Nombre
        .input('nombre', sql.VarChar(100), nombre) 
        .execute('pa_GetIdClient');

      return result.recordset[0]?.id || result.recordset[0]?.Id || null;
    } catch (error) {
      console.error('Error en getIdClient:', error);
      throw error;
    }
  }
};
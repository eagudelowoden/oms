import sql from 'mssql';
import { getDBConnection } from '../../../../lib/db';

export interface ClienteData {
  id: number;
  nombre: string;
  dbase: string;
}

// Interfaz para el tipado estricto de las filas
interface SQLRow {
  id?: number;
  nombre?: string;
  dbase?: string;
  [key: string]: unknown;
}

export const ClienteBackendService = {
  /**
   * Obtiene la lista de clientes autorizados.
   * Lógica: SP para nombres -> Query para detalles (id, dbase).
   */
  async getListClient(usuarioId: number): Promise<ClienteData[]> {
    try {
      const pool = await getDBConnection(true); 

      // 1. Ejecutar SP pa_GetListClient con el parámetro EXACTO @UsuarioId
      const resultSP = await pool.request()
        .input('UsuarioId', sql.Int, usuarioId)
        .execute('pa_GetListClient');

      const rowsSP = resultSP.recordset as SQLRow[];
      const nombres = rowsSP
        .map((r) => (r.nombre ?? r.Nombre ?? "") as string)
        .filter((n) => n !== "");

      if (nombres.length === 0) return [];

      /**
       * 2. Como el SP no trae el dbase, lo consultamos directamente de la tabla.
       * Filtramos por UsuarioId para asegurar que solo vea lo permitido.
       */
      const resultDetalles = await pool.request()
        .input('UId', sql.Int, usuarioId)
        .query(`
          SELECT 
            c.id, 
            c.nombre, 
            c.dbase 
          FROM Cliente c
          INNER JOIN UsuarioCliente uc ON c.id = uc.clienteId
          WHERE uc.usuarioId = @UId
          ORDER BY c.nombre
        `);

      const rowsDetalles = resultDetalles.recordset as SQLRow[];

      return rowsDetalles.map((r): ClienteData => ({
        id: (r.id ?? 0) as number,
        nombre: (r.nombre ?? "") as string,
        dbase: (r.dbase ?? "") as string
      }));

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido en SQL";
      console.error('❌ Error en ClienteBackendService.getListClient:', msg);
      throw new Error(msg);
    }
  },

  /**
   * Busca el ID de un cliente por nombre usando el SP pa_GetIdClient
   */
  async getIdClient(nombre: string): Promise<number | null> {
    try {
      const pool = await getDBConnection(true);
      const result = await pool.request()
        .input('Nombre', sql.VarChar(50), nombre) // Parámetro EXACTO @Nombre
        .execute('pa_GetIdClient');

      const record = result.recordset[0] as SQLRow | undefined;
      return (record?.id ?? record?.Id ?? null) as number | null;
    } catch (error: unknown) {
      console.error('❌ Error en getIdClient:', error);
      return null;
    }
  }
};
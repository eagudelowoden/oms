import sql from "mssql";
import { execQuery } from "@/lib/db-helpers";
import { getDBConnection } from "@/lib/db";

export interface PrealertaEnvioRow {
  id: number;
  nombre: string;
  ciudad: string;
  fecha: string | null;
  usuarioNombre: string;
  estado: string;
  programado: string | null;
  fechaAutorizado: string | null;
  noAutorizacion: string | null;
}

export const ConfirmarEnvioService = {
  async getValidaReco(clientId: number): Promise<number> {
    try {
      const pool = await getDBConnection(true);
      const result = await pool
        .request()
        .input("ClientId", sql.Int, clientId)
        .query("SELECT validaReco FROM Cliente WHERE id = @ClientId");

      const row = result.recordset[0] as { validaReco?: number } | undefined;
      return row?.validaReco ?? 0;
    } catch (error) {
      console.error("❌ Error en getValidaReco:", error);
      return 0;
    }
  },

  async getPrealertas(validaReco: number): Promise<PrealertaEnvioRow[]> {
    const estado = validaReco === 1 ? "Verificado" : "Autorizado";

    const rows = await execQuery<{
      Id: number;
      Nombre: string | null;
      Ciudad: string | null;
      Fecha: Date | string | null;
      UsuarioNombre: string | null;
      Estado: string | null;
      Programado: string | null;
      FechaAutorizado: string | null;
      NoAutorizacion: string | null;
    }>(
      `
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120)    AS Programado,
        CONVERT(VARCHAR(19), p.FechaAutorizado, 120) AS FechaAutorizado,
        p.NoAutorizacion
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado = @Estado
      ORDER BY p.Fecha DESC
    `,
      { Estado: estado },
    );

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: r.Estado ?? "Pendiente",
      programado: r.Programado ?? null,
      fechaAutorizado: r.FechaAutorizado ?? null,
      noAutorizacion: r.NoAutorizacion ?? null,
    }));
  },

  async confirmarEnvio(id: number): Promise<void> {
    await execQuery(
      `UPDATE Prealerta
       SET Estado = 'Enviado', FechaEnvio = GETDATE()
       WHERE Id = @Id AND Activo = 1`,
      { Id: id },
    );
  },
};

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
  fechaEnvio: string | null;
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
    // validaReco=1 → solo Verificado; validaReco=0 → solo Autorizado
    // Después de confirmar envío el estado queda en 'Enviado' (se mantiene visible)
    const estadoBase = validaReco === 1 ? "Verificado" : "Autorizado";

    console.log(`[ConfirmarEnvio] getPrealertas validaReco=${validaReco} estadoBase=${estadoBase}`);

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
      FechaEnvio: string | null;
    }>(
      `
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120)      AS Programado,
        CONVERT(VARCHAR(19), p.FechaAutorizado, 120) AS FechaAutorizado,
        p.NoAutorizacion,
        CONVERT(VARCHAR(19), p.FechaEnvio, 120)      AS FechaEnvio
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado IN ('Autorizado', 'Verificado', 'Enviado')
      ORDER BY p.Fecha DESC
    `,
    );

    console.log(`[ConfirmarEnvio] Total filas SQL: ${rows.length}`);
    if (rows.length > 0) {
      const estados = [...new Set(rows.map((r) => r.Estado))];
      console.log(`[ConfirmarEnvio] Estados encontrados: ${JSON.stringify(estados)}`);
    }

    // Mantener las del estadoBase + las que ya fueron Enviadas (confirmadas)
    const resultado = rows.filter(
      (r) => (r.Estado ?? "") === estadoBase || (r.Estado ?? "") === "Enviado",
    );

    // Si por alguna razón no hay nada con el estadoBase, devolver todo lo que llegó
    const final = resultado.length > 0 ? resultado : rows;

    console.log(`[ConfirmarEnvio] Filas devueltas: ${final.length}`);

    return final.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: r.Estado ?? "Pendiente",
      programado: r.Programado ?? null,
      fechaAutorizado: r.FechaAutorizado ?? null,
      noAutorizacion: r.NoAutorizacion ?? null,
      fechaEnvio: r.FechaEnvio ?? null,
    }));
  },

  async confirmarEnvio(id: number): Promise<void> {
    await execQuery(
      `UPDATE Prealerta SET Estado = 'Enviado', FechaEnvio = GETDATE() WHERE Id = @Id AND Activo = 1`,
      { Id: id },
    );
  },
};

import { execQuery } from "@/lib/db-helpers";

export interface PrealertaRecepcionRow {
  id: number;
  nombre: string;
  ciudad: string;
  fecha: string | null;
  usuarioNombre: string;
  estado: string;
  programado: string | null;
  fechaEnvio: string;
}

export const ConfirmarRecepcionService = {
  async getPrealertas(): Promise<PrealertaRecepcionRow[]> {
    console.log("[ConfirmarRecepcion] getPrealertas — buscando Estado IN ('Enviado','Recibido')");

    const rows = await execQuery<{
      Id: number;
      Nombre: string | null;
      Ciudad: string | null;
      Fecha: Date | string | null;
      UsuarioNombre: string | null;
      Estado: string | null;
      Programado: string | null;
    }>(`
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120) AS Programado
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado IN ('Enviado', 'Recibido')
      ORDER BY p.Fecha DESC
    `);

    console.log(`[ConfirmarRecepcion] Total filas SQL: ${rows.length}`);
    if (rows.length > 0) {
      const estados = [...new Set(rows.map((r) => r.Estado))];
      console.log(`[ConfirmarRecepcion] Estados encontrados: ${JSON.stringify(estados)}`);
    }

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: r.Estado ?? "Enviado",
      programado: r.Programado ?? null,
      fechaEnvio: "",
    }));
  },

  async confirmarRecepcion(id: number): Promise<void> {
    try {
      await execQuery(
        `UPDATE Prealerta SET Estado = 'Recibido', FechaRecepcion = GETDATE() WHERE Id = @Id AND Activo = 1`,
        { Id: id },
      );
    } catch {
      await execQuery(
        `UPDATE Prealerta SET Estado = 'Recibido' WHERE Id = @Id AND Activo = 1`,
        { Id: id },
      );
    }
  },
};

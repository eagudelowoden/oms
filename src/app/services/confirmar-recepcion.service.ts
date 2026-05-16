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
        AND p.Estado = 'Enviado'
      ORDER BY p.Fecha DESC
    `);

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
    await execQuery(
      `UPDATE Prealerta
       SET Estado = 'Recibido', FechaRecepcion = GETDATE()
       WHERE Id = @Id AND Activo = 1`,
      { Id: id },
    );
  },
};

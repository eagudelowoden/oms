import { execQuery } from "@/lib/db-helpers";

export interface PrealertaRecoleccionRow {
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

export interface MaterialRow {
  descripcion: string;
  codigoSap: string;
  serial: string;
  mac: string | null;
  caja: number;
  estado: string;
  cantidad: number;
  tipo: string;
  tecnico: string;
  tramite: string;
}

export const ProgramarRecoleccionService = {
  async getListPrealertas(): Promise<PrealertaRecoleccionRow[]> {
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
    }>(`
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120) AS Programado,
        CONVERT(VARCHAR(19), p.FechaAutorizado, 120) AS FechaAutorizado,
        p.NoAutorizacion
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
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: r.Estado ?? "Pendiente",
      programado: r.Programado ?? null,
      fechaAutorizado: r.FechaAutorizado ?? null,
      noAutorizacion: r.NoAutorizacion ?? null,
    }));
  },

  async getMateriales(prealertaId: number): Promise<MaterialRow[]> {
    const rows = await execQuery<{
      Descripcion: string | null;
      CodigoSap: string | null;
      Serial: string;
      Mac: string | null;
      Caja: number;
      Cantidad: number;
      Tipo: string | null;
      TecnicoCliente: string | null;
      Tramite: string | null;
    }>(
      `SELECT
         Descripcion,
         CodigoSap,
         Serial,
         Mac,
         Caja,
         Cantidad,
         Tipo,
         TecnicoCliente,
         Tramite
       FROM PrealertaSerial
       WHERE PrealertaId = @id
       ORDER BY Caja ASC, Serial ASC`,
      { id: prealertaId },
    );

    return rows.map((r) => ({
      descripcion: r.Descripcion ?? "",
      codigoSap: r.CodigoSap ?? "",
      serial: r.Serial,
      mac: r.Mac ?? null,
      caja: r.Caja,
      estado: r.Caja > 0 ? "Empacado" : "Disponible",
      cantidad: r.Cantidad,
      tipo: r.Tipo ?? "Serializable",
      tecnico: r.TecnicoCliente ?? "",
      tramite: r.Tramite ?? "",
    }));
  },

  async verificarEmpacado(prealertaId: number): Promise<boolean> {
    const rows = await execQuery<{ sinEmpacar: number }>(
      `SELECT COUNT(*) AS sinEmpacar
       FROM PrealertaSerial
       WHERE PrealertaId = @id AND (Caja = 0 OR Caja IS NULL)`,
      { id: prealertaId },
    );
    return (rows[0]?.sinEmpacar ?? 0) === 0;
  },

  async programar(
    prealertaId: number,
    fecha: string,
  ): Promise<{ success: boolean }> {
    await execQuery(`UPDATE Prealerta SET Programado = @fecha, Estado = 'Programado' WHERE Id = @id`, {
      id: prealertaId,
      fecha,
    });
    return { success: true };
  },

  async getListPrealertasProgramadas(): Promise<PrealertaRecoleccionRow[]> {
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
    }>(`
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120) AS Programado,
        CONVERT(VARCHAR(19), p.FechaAutorizado, 120) AS FechaAutorizado,
        p.NoAutorizacion
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado IN ('Programado', 'Autorizado')
      ORDER BY p.Programado DESC
    `);

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

  async desprogramar(prealertaId: number): Promise<{ success: boolean }> {
    await execQuery(`UPDATE Prealerta SET Programado = NULL WHERE Id = @id`, {
      id: prealertaId,
    });
    return { success: true };
  },

  async autorizar(
    prealertaId: number,
    noAutorizacion: string,
    observacion: string = "",
  ): Promise<{ success: boolean }> {
    try {
      await execQuery(
        `UPDATE Prealerta SET FechaAutorizado = GETDATE(), NoAutorizacion = @noAutorizacion, Observacion = @observacion, Estado = 'Autorizado' WHERE Id = @id`,
        { id: prealertaId, noAutorizacion, observacion },
      );
    } catch {
      // Si la columna Observacion no existe aún, actualizar sin ella
      await execQuery(
        `UPDATE Prealerta SET FechaAutorizado = GETDATE(), NoAutorizacion = @noAutorizacion, Estado = 'Autorizado' WHERE Id = @id`,
        { id: prealertaId, noAutorizacion },
      );
    }
    return { success: true };
  },
};

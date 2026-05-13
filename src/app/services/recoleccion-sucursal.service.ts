import { execQuery } from "@/lib/db-helpers";

export interface PrealertaSucursalRow {
  id: number;
  nombre: string;
  ciudad: string;
  fecha: string | null;
  usuarioNombre: string;
  estado: string;
  programado: string | null;
}

export interface SerialRecoleccionRow {
  id: number;
  descripcion: string;
  codigoSap: string;
  serial: string;
  mac: string | null;
  caja: number;
  cantidad: number;
  tecnico: string;
  tramite: string;
  recogido: number; // 0 = pendiente, 1 = recogido
}

export interface AccesorioRecoleccionRow {
  id: number;
  descripcion: string;
  codigoSap: string;
  caja: number;
  cantidad: number;
  cantidadRecibida: number;
  tecnico: string;
  tramite: string;
}

export const RecoleccionSucursalService = {
  async getPrealertas(): Promise<PrealertaSucursalRow[]> {
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
        s.Nombre AS Ciudad,
        p.Fecha,
        u.nombres AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(10), p.Programado, 120) AS Programado
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado IN ('Programada', 'Autorizado')
      ORDER BY p.Programado DESC
    `);

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: r.Estado ?? "Programada",
      programado: r.Programado ?? null,
    }));
  },

  async getSeriales(prealertaId: number): Promise<SerialRecoleccionRow[]> {
    const rows = await execQuery<{
      Id: number;
      Descripcion: string | null;
      CodigoSap: string | null;
      Serial: string;
      Mac: string | null;
      Caja: number;
      Cantidad: number;
      TecnicoCliente: string | null;
      Tramite: string | null;
      Recogido: number;
    }>(
      `SELECT
         Id,
         Descripcion,
         CodigoSap,
         Serial,
         Mac,
         Caja,
         Cantidad,
         TecnicoCliente,
         Tramite,
         ISNULL(Recogido, 0) AS Recogido
       FROM PrealertaSerial
       WHERE PrealertaId = @id
         AND LOWER(ISNULL(Tipo, 'serializable')) NOT LIKE '%no%'
       ORDER BY Caja ASC, Serial ASC`,
      { id: prealertaId },
    );

    return rows.map((r) => ({
      id: r.Id,
      descripcion: r.Descripcion ?? "",
      codigoSap: r.CodigoSap ?? "",
      serial: r.Serial,
      mac: r.Mac ?? null,
      caja: r.Caja,
      cantidad: r.Cantidad,
      tecnico: r.TecnicoCliente ?? "",
      tramite: r.Tramite ?? "",
      recogido: r.Recogido,
    }));
  },

  async getAccesorios(prealertaId: number): Promise<AccesorioRecoleccionRow[]> {
    const rows = await execQuery<{
      Id: number;
      Descripcion: string | null;
      CodigoSap: string | null;
      Caja: number;
      Cantidad: number;
      TecnicoCliente: string | null;
      Tramite: string | null;
    }>(
      `SELECT
         Id,
         Descripcion,
         CodigoSap,
         Caja,
         Cantidad,
         TecnicoCliente,
         Tramite
       FROM PrealertaSerial
       WHERE PrealertaId = @id
         AND LOWER(Tipo) LIKE '%no%'
       ORDER BY Caja ASC, Descripcion ASC`,
      { id: prealertaId },
    );

    return rows.map((r) => ({
      id: r.Id,
      descripcion: r.Descripcion ?? "",
      codigoSap: r.CodigoSap ?? "",
      caja: r.Caja,
      cantidad: r.Cantidad,
      cantidadRecibida: 0,
      tecnico: r.TecnicoCliente ?? "",
      tramite: r.Tramite ?? "",
    }));
  },

  async escanearSerial(
    prealertaId: number,
    serial: string,
  ): Promise<{ found: boolean; id?: number }> {
    const rows = await execQuery<{ Id: number }>(
      `SELECT Id FROM PrealertaSerial
       WHERE PrealertaId = @prealertaId AND Serial = @serial`,
      { prealertaId, serial },
    );

    if (rows.length === 0) return { found: false };

    await execQuery(
      `UPDATE PrealertaSerial SET Recogido = 1 WHERE Id = @id`,
      { id: rows[0].Id },
    );
    return { found: true, id: rows[0].Id };
  },

  async cerrarVerificacion(prealertaId: number): Promise<{ success: boolean }> {
    await execQuery(
      `UPDATE Prealerta SET Estado = 'En Tránsito' WHERE Id = @id`,
      { id: prealertaId },
    );
    return { success: true };
  },
};

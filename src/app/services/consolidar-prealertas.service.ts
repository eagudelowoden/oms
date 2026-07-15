import { execQuery } from "@/lib/db-helpers";

export interface PrealertaConsolidarRow {
  id: number;
  nombre: string;
  ciudad: string;
  fecha: string | null;
  usuarioNombre: string;
  estado: string;
  fechaRecepcion: string | null;
}

export interface MaterialConsolidarRow {
  id: number;
  descripcion: string;
  codigoSap: string;
  serial: string;
  caja: number;
  estado: string;
  ciudad: string;
  tipo: string;
  tecnico: string;
  prealertaNombre: string;
  prealertaId: number;
}

export interface AccesorioConsolidarRow {
  id: number;
  descripcion: string;
  codigoSap: string;
  cantidad: number;
  caja: number;
  estado: string;
  ciudad: string;
  tipo: string;
  tecnico: string;
  prealertaNombre: string;
  prealertaId: number;
}

export interface PrealertaConsolidadaRow {
  id: number;
  nombre: string;
  prealertasOrigen: string;
  fecha: string | null;
  creadoPor: string;
  estado: string;
}

export interface SerialDescargaRow {
  Serial: string;
  Mac: string;
  CodigoSap: string;
  Descripcion: string;
  Caja: number;
  Cantidad: number;
  Tipo: string;
}

async function ensureConsolidadaTable() {
  await execQuery(`
    IF NOT EXISTS (
      SELECT * FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'PrealertaConsolidada'
    )
    CREATE TABLE PrealertaConsolidada (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      PrealertaConsolidadaId INT NOT NULL,
      PrealertaOrigenId INT NOT NULL,
      Fecha DATETIME DEFAULT GETDATE()
    )
  `);
}

export const ConsolidarPrealertasService = {
  async getPrealertas(): Promise<PrealertaConsolidarRow[]> {
    const rows = await execQuery<{
      Id: number;
      Nombre: string | null;
      Ciudad: string | null;
      Fecha: Date | string | null;
      UsuarioNombre: string | null;
      Estado: string | null;
      FechaRecepcion: string | null;
    }>(`
      SELECT
        p.Id,
        p.Nombre,
        s.Nombre        AS Ciudad,
        p.Fecha,
        u.nombres       AS UsuarioNombre,
        p.Estado,
        CONVERT(VARCHAR(19), p.FechaRecepcion, 120) AS FechaRecepcion
      FROM Prealerta p
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE p.Activo = 1
        AND p.Estado = 'Recibido'
      ORDER BY p.Fecha DESC
    `);

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      ciudad: r.Ciudad ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      estado: "Recepción Confirmada",
      fechaRecepcion: r.FechaRecepcion ?? null,
    }));
  },

  async getMateriales(ids: number[]): Promise<MaterialConsolidarRow[]> {
    if (ids.length === 0) return [];
    const idList = ids.join(",");

    const rows = await execQuery<{
      Id: number;
      Descripcion: string | null;
      CodigoSap: string | null;
      Serial: string;
      Caja: number;
      Ciudad: string | null;
      TecnicoCliente: string | null;
      PrealertaNombre: string | null;
      PrealertaId: number;
    }>(`
      SELECT
        ps.Id,
        ps.Descripcion,
        ps.CodigoSap,
        ps.Serial,
        ps.Caja,
        s.Nombre AS Ciudad,
        ps.TecnicoCliente,
        p.Nombre AS PrealertaNombre,
        p.Id AS PrealertaId
      FROM PrealertaSerial ps
      JOIN Prealerta p ON ps.PrealertaId = p.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE ps.PrealertaId IN (${idList})
        AND LOWER(ISNULL(ps.Tipo, 'serializable')) NOT LIKE '%no%'
      ORDER BY p.Id ASC, ps.Caja ASC, ps.Serial ASC
    `);

    return rows.map((r) => ({
      id: r.Id,
      descripcion: r.Descripcion ?? "",
      codigoSap: r.CodigoSap ?? "",
      serial: r.Serial,
      caja: r.Caja,
      estado: r.Caja > 0 ? "Empacado" : "Sin empacar",
      ciudad: r.Ciudad ?? "",
      tipo: "Serializable",
      tecnico: r.TecnicoCliente ?? "",
      prealertaNombre: r.PrealertaNombre ?? "",
      prealertaId: r.PrealertaId,
    }));
  },

  async getAccesorios(ids: number[]): Promise<AccesorioConsolidarRow[]> {
    if (ids.length === 0) return [];
    const idList = ids.join(",");

    const rows = await execQuery<{
      Id: number;
      Descripcion: string | null;
      CodigoSap: string | null;
      Cantidad: number;
      Caja: number;
      Ciudad: string | null;
      TecnicoCliente: string | null;
      PrealertaNombre: string | null;
      PrealertaId: number;
    }>(`
      SELECT
        ps.Id,
        ps.Descripcion,
        ps.CodigoSap,
        ps.Cantidad,
        ps.Caja,
        s.Nombre AS Ciudad,
        ps.TecnicoCliente,
        p.Nombre AS PrealertaNombre,
        p.Id AS PrealertaId
      FROM PrealertaSerial ps
      JOIN Prealerta p ON ps.PrealertaId = p.Id
      LEFT JOIN WmsWdGeneral.dbo.Sede s ON p.OrigenId = s.Id
      WHERE ps.PrealertaId IN (${idList})
        AND LOWER(ISNULL(ps.Tipo, '')) LIKE '%no%'
      ORDER BY p.Id ASC, ps.Caja ASC, ps.Descripcion ASC
    `);

    return rows.map((r) => ({
      id: r.Id,
      descripcion: r.Descripcion ?? "",
      codigoSap: r.CodigoSap ?? "",
      cantidad: r.Cantidad,
      caja: r.Caja,
      estado: r.Caja > 0 ? "Empacado" : "Sin empacar",
      ciudad: r.Ciudad ?? "",
      tipo: "No Serializable",
      tecnico: r.TecnicoCliente ?? "",
      prealertaNombre: r.PrealertaNombre ?? "",
      prealertaId: r.PrealertaId,
    }));
  },

  async consolidar(
    ids: number[],
    usuarioId: number,
  ): Promise<{ id: number; nombre: string }> {
    await ensureConsolidadaTable();

    // Get origin info from first prealerta
    const [origen] = await execQuery<{
      TipoOrigenId: number;
      OrigenId: number;
    }>(
      `SELECT TOP 1 TipoOrigenId, OrigenId FROM Prealerta WHERE Id = @id`,
      { id: ids[0] },
    );

    if (!origen) throw new Error("No se encontró la prealerta origen");

    // Create consolidated prealerta
    const [newRow] = await execQuery<{ NewId: number }>(`
      INSERT INTO Prealerta (Nombre, TipoOrigenId, OrigenId, Guia, UsuarioId, Fecha, IdResponsable, Estado, Activo)
      OUTPUT INSERTED.Id AS NewId
      VALUES (
        'Consolidada-TEMP',
        @TipoOrigenId,
        @OrigenId,
        '',
        @UsuarioId,
        GETDATE(),
        @UsuarioId,
        'Consolidada',
        1
      )
    `, {
      TipoOrigenId: origen.TipoOrigenId,
      OrigenId: origen.OrigenId,
      UsuarioId: usuarioId,
    });

    const newId = newRow.NewId;
    const nombre = `Prealerta-consolidada-${newId}`;

    await execQuery(
      `UPDATE Prealerta SET Nombre = @nombre WHERE Id = @id`,
      { nombre, id: newId },
    );

    // Copy all serials from origin prealertas
    const idList = ids.join(",");
    await execQuery(`
      INSERT INTO PrealertaSerial
        (PrealertaId, Serial, Mac, CodigoSap, Descripcion, Cantidad, Caja, Falla, TecnicoCliente, Pedido, Tramite, Novedad, Garantia, Tipo)
      SELECT
        ${newId}, Serial, Mac, CodigoSap, Descripcion, Cantidad, Caja, Falla, TecnicoCliente, Pedido, Tramite, Novedad, Garantia, Tipo
      FROM PrealertaSerial
      WHERE PrealertaId IN (${idList})
    `);

    // Track origin prealertas and mark them as consolidated
    for (const origenId of ids) {
      await execQuery(
        `INSERT INTO PrealertaConsolidada (PrealertaConsolidadaId, PrealertaOrigenId) VALUES (@consolidadaId, @origenId)`,
        { consolidadaId: newId, origenId },
      );
      await execQuery(
        `UPDATE Prealerta SET Estado = 'Consolidada' WHERE Id = @id`,
        { id: origenId },
      );
    }

    return { id: newId, nombre };
  },

  /**
   * Devuelve todos los seriales de una prealerta (consolidada) con las mismas
   * columnas del formato que se carga, para poder re-descargar el archivo.
   */
  async getSerialesDescarga(prealertaId: number): Promise<SerialDescargaRow[]> {
    const rows = await execQuery<{
      Serial: string | null;
      Mac: string | null;
      CodigoSap: string | null;
      Descripcion: string | null;
      Caja: number | null;
      Cantidad: number | null;
      Tipo: string | null;
    }>(
      `SELECT
         Serial,
         Mac,
         CodigoSap,
         Descripcion,
         Caja,
         Cantidad,
         Tipo
       FROM PrealertaSerial
       WHERE PrealertaId = @id
       ORDER BY Caja ASC, Serial ASC`,
      { id: prealertaId },
    );

    return rows.map((r) => ({
      Serial: r.Serial ?? "",
      Mac: r.Mac ?? "",
      CodigoSap: r.CodigoSap ?? "",
      Descripcion: r.Descripcion ?? "",
      Caja: r.Caja ?? 0,
      Cantidad: r.Cantidad ?? 1,
      Tipo: r.Tipo ?? "Serializable",
    }));
  },

  async getConsolidadas(): Promise<PrealertaConsolidadaRow[]> {
    await ensureConsolidadaTable();

    const rows = await execQuery<{
      Id: number;
      Nombre: string | null;
      PrealertasOrigen: string | null;
      Fecha: Date | string | null;
      CreadoPor: string | null;
      Estado: string | null;
    }>(`
      SELECT TOP 10
        p.Id,
        p.Nombre,
        STUFF((
          SELECT ',' + CAST(pc2.PrealertaOrigenId AS VARCHAR)
          FROM PrealertaConsolidada pc2
          WHERE pc2.PrealertaConsolidadaId = p.Id
          FOR XML PATH('')
        ), 1, 1, '') AS PrealertasOrigen,
        p.Fecha,
        u.nombres AS CreadoPor,
        p.Estado
      FROM Prealerta p
      JOIN PrealertaConsolidada pc ON p.Id = pc.PrealertaConsolidadaId
      LEFT JOIN UsuarioSys u ON p.UsuarioId = u.Id
      WHERE p.Estado = 'Consolidada' AND p.Activo = 1
      GROUP BY p.Id, p.Nombre, p.Fecha, u.nombres, p.Estado
      ORDER BY p.Fecha DESC
    `);

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "",
      prealertasOrigen: r.PrealertasOrigen ?? "",
      fecha: r.Fecha ? new Date(r.Fecha).toLocaleString("es-CO") : null,
      creadoPor: r.CreadoPor ?? "Desconocido",
      estado: r.Estado ?? "Consolidada",
    }));
  },
};

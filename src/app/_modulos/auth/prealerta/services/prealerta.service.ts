import sql from "mssql";
import { getDBConnection } from "../../../../../lib/db";

export const PrealertaBackendService = {
  // Consume pa_InsertPrealert
  async insertPrealert(data: {
    nombre: string;
    tipoOrigenId: number;
    origenId: number;
    guia: string;
    usuarioId: number;
    idResponsable: number;
    estado: string;
  }) {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("Nombre", sql.VarChar(50), data.nombre)
      .input("TipoOrigenId", sql.Int, data.tipoOrigenId)
      .input("OrigenId", sql.Int, data.origenId)
      .input("Guia", sql.VarChar(30), data.guia)
      .input("UsuarioId", sql.Int, data.usuarioId)
      .input("Fecha", sql.DateTime, new Date())
      .input("IdResponsable", sql.Int, data.idResponsable)
      .input("Estado", sql.VarChar(20), data.estado)
      .execute("pa_InsertPrealertOms");

    const id = result.recordset?.[0]?.Id ?? null;
    return { success: true, id };
  },
  async insertPrealertSerialBatch(data: {
    prealertaId: number;
    caja: number;
    seriales: { serial: string; mac: string; tipo: string }[];
  }) {
    const pool = await getDBConnection();
    let exitosos = 0,
      yaExistian = 0,
      fallidos = 0;

    // Ejecutar en paralelo con Promise.all (o en lotes de 10)
    const LOTE = 10;
    for (let i = 0; i < data.seriales.length; i += LOTE) {
      const lote = data.seriales.slice(i, i + LOTE);
      await Promise.all(
        lote.map(async ({ serial, mac, tipo }) => {
          try {
            const result = await pool
              .request()
              .input("PrealertaId", sql.Int, data.prealertaId)
              .input("Serial", sql.VarChar(50), serial)
              .input("Mac", sql.VarChar(50), mac)
              .input("CodigoSap", sql.VarChar(20), "")
              .input("Descripcion", sql.VarChar(150), "")
              .input("Cantidad", sql.Int, 1)
              .input("Caja", sql.Int, data.caja)
              .input("Falla", sql.VarChar(100), "")
              .input("TecnicoCliente", sql.VarChar(50), "")
              .input("Pedido", sql.VarChar(30), "")
              .input("Tramite", sql.VarChar(30), "")
              .input("Novedad", sql.VarChar(30), "")
              .input("Garantia", sql.Int, 0)
              .input("Tipo", sql.VarChar(30), tipo)
              .execute("pa_InsertPrealertSerialOms");

            const row = result.recordset?.[0];
            if (row?.estado === "YA_EXISTE") yaExistian++;
            else exitosos++;
          } catch {
            fallidos++;
          }
        }),
      );
    }

    return { success: true, exitosos, yaExistian, fallidos };
  },

  async getSerialsByPrealerta(prealertaId: number): Promise<
    {
      codigo: string;
      origen: "api";
      estado: "Empacado";
      tipo: string;
    }[]
  > {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("PrealertaId", sql.Int, prealertaId).query(`
      SELECT Serial AS codigo, Caja AS caja, Tipo AS tipo
      FROM PrealertaSerial
      WHERE PrealertaId = @PrealertaId
    `);
    return result.recordset.map((r) => ({
      codigo: r.codigo,
      origen: "api" as const,
      estado: "Empacado" as const,
      tipo: r.tipo ?? "Serializable",
      caja: r.caja,
    }));
  },
  async desempacarSeriales(
    prealertaId: number,
    seriales: string[],
  ): Promise<number> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("PrealertaId", sql.Int, prealertaId)
      .input("Seriales", sql.NVarChar(sql.MAX), JSON.stringify(seriales))
      .execute("pa_DesempacarSerialesOms");

    return result.recordset[0]?.actualizados ?? 0; // ← eliminados → actualizados
  },

  async eliminarSerial(prealertaId: number, serial: string): Promise<number> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("PrealertaId", sql.Int, prealertaId)
      .input("Serial", sql.NVarChar(50), serial)
      .execute("pa_EliminarSerialOms");

    return result.recordset[0]?.eliminados ?? 0;
  },

  // Consume pa_GetListPrealert
  async getListPrealert(): Promise<
    { id: number; nombre: string; fecha?: string; estado?: string }[]
  > {
    try {
      const pool = await getDBConnection();
      const result = await pool.request().execute("pa_GetListPrealertOms");
      if (!result.recordset) return [];

      return result.recordset.map((r) => ({
        id: r.Id || r.id,
        nombre: r.Nombre || r.nombre || "Sin Nombre",
        fecha: r.Fecha || r.fecha,
        estado: r.Estado || r.estado,
        usuarioId: r.UsuarioId || r.usuarioId,
        usuarioNombre: r.UsuarioNombre || r.usuarioNombre,
        tipoOrigenId: r.TipoOrigenId || r.tipoOrigenId,
        origenId: r.OrigenId || r.origenId,
      }));
    } catch (error) {
      console.error("Error en getListPrealert:", error);
      throw error;
    }
  },

  // Consume pa_GetIdPrealert
  async getIdPrealert(nombre: string): Promise<number | null> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("Nombre", sql.VarChar(50), nombre)
      .execute("pa_GetIdPrealert");
    return result.recordset[0]?.Id || result.recordset[0]?.id || null;
  },
  async getUltimaCaja(prealertaId: number): Promise<number> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("PrealertaId", sql.Int, prealertaId).query(`
      SELECT ISNULL(MAX(Caja), 0) AS ultimaCaja
      FROM PrealertaSerial
      WHERE PrealertaId = @PrealertaId
    `);
    return result.recordset[0].ultimaCaja;
  },

  // Consume pa_DeletePrealert
  async deletePrealert(id: number): Promise<{ success: boolean }> {
    const pool = await getDBConnection();
    await pool.request().input("Id", sql.Int, id).execute("pa_DeletePrealert");
    return { success: true };
  },

  async getSedes(): Promise<{ id: number; nombre: string }[]> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .query("SELECT Id, Nombre FROM WmsWdGeneral.dbo.Sede");

    if (!result.recordset) return [];
    return result.recordset.map((r) => ({
      id: r.Id || r.id,
      nombre: r.Nombre || r.nombre || "Sin nombre",
    }));
  },
};

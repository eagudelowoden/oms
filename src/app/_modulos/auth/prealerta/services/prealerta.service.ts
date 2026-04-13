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
  async insertPrealertSerial(data: {
    prealertaId: number;
    serial: string;
    mac: string;
    codigoSap: string;
    descripcion: string;
    cantidad: number;
    caja: number;
    falla: string;
    tecnicoCliente: string;
    pedido: string;
    tramite: string;
    novedad: string;
    garantia: number;
    tipo: string;
  }) {
    const pool = await getDBConnection();
    try {
      const result = await pool
        .request()
        .input("PrealertaId", sql.Int, data.prealertaId)
        .input("Serial", sql.VarChar(50), data.serial)
        .input("Mac", sql.VarChar(50), data.mac)
        .input("CodigoSap", sql.VarChar(20), data.codigoSap)
        .input("Descripcion", sql.VarChar(150), data.descripcion)
        .input("Cantidad", sql.Int, data.cantidad)
        .input("Caja", sql.Int, data.caja)
        .input("Falla", sql.VarChar(100), data.falla)
        .input("TecnicoCliente", sql.VarChar(50), data.tecnicoCliente)
        .input("Pedido", sql.VarChar(30), data.pedido)
        .input("Tramite", sql.VarChar(30), data.tramite)
        .input("Novedad", sql.VarChar(30), data.novedad)
        .input("Garantia", sql.Int, data.garantia)
        .input("Tipo", sql.VarChar(30), data.tipo)
        .execute("pa_InsertPrealertSerialOms");

      const row = result.recordset?.[0];
      console.log(`📦 Serial ${data.serial}: ${row?.estado}`);

      return {
        success: true,
        estado: row?.estado ?? "INSERTADO",
        insertado: row?.insertado ?? 1,
      };
    } catch (err) {
      console.error("❌ error insertando serial:", err);
      throw err;
    }
  },
  // prealerta.service.ts
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

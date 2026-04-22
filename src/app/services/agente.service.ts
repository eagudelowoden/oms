import sql from "mssql";
import { getDBConnection } from "@/lib/db";
import { execProc } from "@/lib/exec-proc";
import { execQuery } from "@/lib/db-helpers";
import {
  SedeTable,
  PrealertaTable,
  PrealertaSerialTable,
  CajaRow,
} from "@/lib/types";

export const AgentesBackendService = {
  async insertPrealert(data: Omit<PrealertaTable, "Id" | "Fecha" | "Activo">) {
    const [result] = await execProc<{ Id: number }>("pa_InsertPrealertOms", {
      Nombre: { type: sql.VarChar(50), value: data.Nombre },
      TipoOrigenId: { type: sql.Int, value: data.TipoOrigenId },
      OrigenId: { type: sql.Int, value: data.OrigenId },
      Guia: { type: sql.VarChar(30), value: data.Guia },
      UsuarioId: { type: sql.Int, value: data.UsuarioId },
      Fecha: { type: sql.DateTime, value: new Date() },
      IdResponsable: { type: sql.Int, value: data.IdResponsable },
      Estado: { type: sql.VarChar(20), value: data.Estado },
    });

    return {
      success: !!result?.Id,
      id: result?.Id ?? null,
    };
  },

  async insertPrealertSerialBatch(data: {
    prealertaId: number;
    caja: number;
    seriales: Partial<PrealertaSerialTable>[];
  }) {
    let exitosos = 0,
      yaExistian = 0,
      fallidos = 0;
    const LOTE = 10;

    for (let i = 0; i < data.seriales.length; i += LOTE) {
      const lote = data.seriales.slice(i, i + LOTE);

      await Promise.all(
        lote.map(async (item) => {
          try {
            const { Serial, Mac, Tipo, Cantidad } = item;
            const [row] = await execProc<{ estado: string }>(
              "pa_InsertPrealertSerialOms",
              {
                PrealertaId: { type: sql.Int, value: data.prealertaId },
                Serial: { type: sql.VarChar(50), value: Serial },
                Mac: { type: sql.VarChar(50), value: Mac ?? "" },
                CodigoSap: { type: sql.VarChar(20), value: "" },
                Descripcion: { type: sql.VarChar(150), value: "" },
                Cantidad: { type: sql.Int, value: Cantidad ?? 1 },
                Caja: { type: sql.Int, value: data.caja },
                Falla: { type: sql.VarChar(100), value: "" },
                TecnicoCliente: { type: sql.VarChar(50), value: "" },
                Pedido: { type: sql.VarChar(30), value: "" },
                Tramite: { type: sql.VarChar(30), value: "" },
                Novedad: { type: sql.VarChar(30), value: "" },
                Garantia: { type: sql.Int, value: 0 },
                Tipo: { type: sql.VarChar(30), value: Tipo ?? "" },
              },
            );

            if (row?.estado === "YA_EXISTE") yaExistian++;
            else exitosos++;
          } catch (error) {
            // Usamos item.Serial para el log por seguridad
            console.error("Error insertando serial:", item.Serial, error);
            fallidos++;
          }
        }),
      );
    }

    return { success: true, exitosos, yaExistian, fallidos };
  },

  async getSerialsByPrealerta(prealertaId: number) {
    // 1. Usamos alias en el SQL para que coincidan con tu interfaz de salida
    // 2. Traemos solo lo necesario de PrealertaSerialTable
    const rows = await execQuery<PrealertaSerialTable>(
      `SELECT 
        Serial AS Id, -- Si necesitas el serial como identificador
        Serial AS codigo, 
        Cantidad AS cantidad, 
        Caja AS caja, 
        Tipo AS tipo
     FROM PrealertaSerial
     WHERE PrealertaId = @id`,
      { id: prealertaId },
    );

    // 3. El map ahora es mucho más limpio
    return rows.map((r) => ({
      codigo: r.CodigoSap,
      origen: "api" as const,
      estado: "Empacado" as const,
      tipo: r.Tipo ?? "Serializable",
      cantidad: r.Cantidad,
      caja: r.Caja,
    }));
  },

  // ── NUEVO: cajas agrupadas con conteo ──
  async getCajasByPrealerta(prealertaId: number) {
    // 1. Definimos la forma de la fila que devuelve el SELECT

    // 2. Ejecutamos la consulta usando el helper y alias en SQL
    const rows = await execQuery<CajaRow>(
      `SELECT
        Caja          AS numero,
        COUNT(*)      AS totalSeriales
     FROM PrealertaSerial
     WHERE PrealertaId = @id
     GROUP BY Caja
     ORDER BY Caja ASC`,
      { id: prealertaId },
    );

    // 3. Mapeamos para agregar la lógica del estado
    return rows.map((r, i, arr) => ({
      numero: r.numero,
      totalSeriales: r.totalSeriales,
      // La última caja del arreglo se considera "abierta"
      estado: (i === arr.length - 1 ? "abierta" : "cerrada") as
        | "abierta"
        | "cerrada",
    }));
  },

  // ── NUEVO: seriales de una caja específica ──
  async getSerialsPorCaja(
    prealertaId: number,
    caja: number,
  ): Promise<{ serial: string; mac: string; tipo: string }[]> {
    const pool = await getDBConnection();
    const result = await pool
      .request()
      .input("PrealertaId", sql.Int, prealertaId)
      .input("Caja", sql.Int, caja).query(`
        SELECT
          Serial  AS serial,
          Mac     AS mac,
          Tipo    AS tipo,
          Cantidad as cantidad
        FROM PrealertaSerial
        WHERE PrealertaId = @PrealertaId
          AND Caja = @Caja
        ORDER BY Serial ASC
      `);

    return result.recordset.map((r) => ({
      serial: r.serial,
      mac: r.mac ?? "",
      tipo: r.tipo ?? "Serializable",
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

    return result.recordset[0]?.actualizados ?? 0;
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

  async deletePrealert(id: number): Promise<{ success: boolean }> {
    const pool = await getDBConnection();
    await pool.request().input("Id", sql.Int, id).execute("pa_DeletePrealert");
    return { success: true };
  },

  async getSedes(): Promise<{ id: number; nombre: string }[]> {
    const result = await execQuery<SedeTable>(
      "SELECT Id, Nombre FROM WmsWdGeneral.dbo.Sede",
    );
    return result.map((r) => ({
      id: r.Id,
      nombre: r.Nombre,
    }));
  },
};

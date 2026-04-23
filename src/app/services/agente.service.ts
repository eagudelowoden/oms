import sql from "mssql";
import { getDBConnection } from "@/lib/db";
import { execProc } from "@/lib/exec-proc";
import { execQuery } from "@/lib/db-helpers";
import {
  SedeTable,
  PrealertaTable,
  PrealertaSerialTable,
  CajaRow,
  SerialCaja,
  PrealertaListRow,
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
            const { Serial, Mac, Tipo, Cantidad, Tramite } = item;
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
                Tramite: { type: sql.VarChar(30), value: Tramite ?? "Manual" },
                Novedad: { type: sql.VarChar(30), value: "" },
                Garantia: { type: sql.Int, value: 0 },
                Tipo: { type: sql.VarChar(30), value: Tipo ?? "" },
              },
            );

            if (row?.estado === "YA_EXISTE") yaExistian++;
            else exitosos++;
          } catch (error) {
            console.error("Error insertando serial:", item.Serial, error);
            fallidos++;
          }
        }),
      );
    }

    return { success: true, exitosos, yaExistian, fallidos };
  },

  async getSerialsByPrealerta(prealertaId: number) {
    const rows = await execQuery<PrealertaSerialTable>(
      `SELECT
      Serial AS Id,
      Serial AS codigo,
      Cantidad AS Cantidad,
      Caja AS Caja,
      Tipo AS Tipo,
      Tramite AS Tramite
    FROM PrealertaSerial
    WHERE PrealertaId = @id`,
      { id: prealertaId },
    );

    return rows.map((r) => ({
      codigo: r.codigo,
      origen: "api" as const,
      estado:
        r.Caja && r.Caja > 0 ? ("Empacado" as const) : ("Disponible" as const),
      tipo: r.Tipo ?? "Serializable",
      cantidad: r.Cantidad,
      caja: r.Caja,
      tramite: r.Tramite ?? "",
    }));
  },

  async getCajasByPrealerta(prealertaId: number) {
    const rows = await execQuery<CajaRow>(
      `SELECT
        Caja          AS numero,
        COUNT(*)      AS totalSeriales
     FROM PrealertaSerial
     WHERE PrealertaId = @id
       AND Caja > 0
     GROUP BY Caja
     ORDER BY Caja ASC`,
      { id: prealertaId },
    );
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
  async getSerialsPorCaja(prealertaId: number, caja: number) {
    const rows = await execQuery<SerialCaja>(
      `SELECT
        Serial   AS serial,
        Mac      AS mac,
        Tipo     AS tipo,
        Cantidad as cantidad,
        Tramite as tramite
     FROM PrealertaSerial
     WHERE PrealertaId = @prealertaId
       AND Caja = @caja
     ORDER BY Serial ASC`,
      {
        prealertaId,
        caja,
      },
    );

    return rows.map((r) => ({
      serial: r.serial,
      mac: r.mac ?? "",
      tipo: r.tipo ?? "Serializable",
      cantidad: r.cantidad ?? "",
      tramite: r.tramite,
    }));
  },

  async desempacarSeriales(
    prealertaId: number,
    seriales: string[],
  ): Promise<number> {
    const [row] = await execProc<{ actualizados: number }>(
      "pa_DesempacarSerialesOms",
      {
        PrealertaId: { type: sql.Int, value: prealertaId },
        Seriales: {
          type: sql.NVarChar(sql.MAX),
          value: JSON.stringify(seriales),
        },
      },
    );

    return row?.actualizados ?? 0;
  },

  async eliminarSerial(prealertaId: number, serial: string): Promise<number> {
    const [row] = await execProc<{ eliminados: number }>(
      "pa_EliminarSerialOms",
      {
        PrealertaId: { type: sql.Int, value: prealertaId },
        Serial: { type: sql.VarChar(50), value: serial },
      },
    );

    return row?.eliminados ?? 0;
  },

  async getListPrealert() {
    const rows = await execProc<PrealertaListRow>("pa_GetListPrealertOms");

    return rows.map((r) => ({
      id: r.Id,
      nombre: r.Nombre ?? "Sin Nombre",
      fecha: r.Fecha ? new Date(r.Fecha).toISOString() : null,
      estado: r.Estado ?? "Pendiente",
      usuarioId: r.UsuarioId,
      usuarioNombre: r.UsuarioNombre ?? "Desconocido",
      tipoOrigenId: r.TipoOrigenId,
      origenId: r.OrigenId,
    }));
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
    const [row] = await execQuery<{ ultimaCaja: number }>(
      `SELECT ISNULL(MAX(Caja), 0) AS ultimaCaja
     FROM PrealertaSerial
     WHERE PrealertaId = @id`,
      { id: prealertaId },
    );
    return row?.ultimaCaja ?? 0;
  },

  async deletePrealert(id: number): Promise<{ success: boolean }> {
    // Usamos execProc para ejecutar el procedimiento de borrado
    // No necesitamos el resultado, así que solo esperamos la ejecución
    await execProc("pa_DeletePrealert", {
      Id: { type: sql.Int, value: id },
    });

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

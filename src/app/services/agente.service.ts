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
      fallidos = 0,
      enOtraPrealerta = 0;
    const LOTE = 10;

    for (let i = 0; i < data.seriales.length; i += LOTE) {
      const lote = data.seriales.slice(i, i + LOTE);

      await Promise.all(
        lote.map(async (item) => {
          try {
            const {
              Serial,
              Mac,
              Tipo,
              Cantidad,
              Tramite,
              CodigoSap,
              Descripcion,
            } = item;

            // Seriales serializables no pueden existir en otra prealerta
            if (Tipo !== "No-serializable" && Serial?.trim()) {
              const duplicado = await execQuery<{ PrealertaId: number }>(
                `SELECT TOP 1 PrealertaId FROM PrealertaSerial
                 WHERE Serial = @serial AND PrealertaId != @prealertaId`,
                { serial: Serial, prealertaId: data.prealertaId },
              );
              if (duplicado.length > 0) {
                enOtraPrealerta++;
                return;
              }
            }

            const [row] = await execProc<{ estado: string }>(
              "pa_InsertPrealertSerialOms",
              {
                PrealertaId: { type: sql.Int, value: data.prealertaId },
                Serial: { type: sql.VarChar(50), value: Serial },
                Mac: { type: sql.VarChar(50), value: Mac ?? "" },
                CodigoSap: { type: sql.VarChar(20), value: CodigoSap ?? "" },
                Descripcion: {
                  type: sql.VarChar(150),
                  value: Descripcion ?? "",
                },
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

    return { success: true, exitosos, yaExistian, fallidos, enOtraPrealerta };
  },

  async getSerialsByPrealerta(prealertaId: number) {
    const rows = await execQuery<PrealertaSerialTable & { TecnicoCliente?: string | null }>(
      `SELECT
      Serial AS Id,
      Serial AS codigo,
      Mac AS Mac,
      Cantidad AS Cantidad,
      Caja AS Caja,
      Tipo AS Tipo,
      Tramite AS Tramite,
      CodigoSap AS CodigoSap,
      Descripcion AS Descripcion,
      TecnicoCliente
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
      mac: r.Mac ?? undefined,
      cantidad: r.Cantidad,
      caja: r.Caja,
      tramite: r.Tramite ?? "",
      codigo_sap: r.CodigoSap ?? undefined,
      descripcion: r.Descripcion ?? undefined,
      tecnico: (r as { TecnicoCliente?: string | null }).TecnicoCliente ?? undefined,
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
        Cantidad AS cantidad,
        Tramite AS tramite,
        CodigoSap AS codigoSap,
        Descripcion AS descripcion
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
      codigoSap: r.codigoSap,
      descripcion: r.descripcion,
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

  async guardarSerialesDisponible(data: {
    prealertaId: number;
    seriales: Array<{
      serial: string;
      mac?: string;
      codigoSap?: string;
      descripcion?: string;
      tramite?: string;
    }>;
  }) {
    let insertados = 0, yaExistian = 0, enOtraPrealerta = 0, fallidos = 0;
    const errores: string[] = [];
    const LOTE = 10;

    for (let i = 0; i < data.seriales.length; i += LOTE) {
      const lote = data.seriales.slice(i, i + LOTE);
      await Promise.all(
        lote.map(async (item) => {
          try {
            // Verificar si existe en otra prealerta
            const enOtra = await execQuery<{ PrealertaId: number }>(
              `SELECT TOP 1 PrealertaId FROM PrealertaSerial
               WHERE Serial = @serial AND PrealertaId != @prealertaId`,
              { serial: item.serial, prealertaId: data.prealertaId },
            );
            if (enOtra.length > 0) { enOtraPrealerta++; return; }

            // Verificar si ya existe en la misma prealerta
            const enMisma = await execQuery<{ Id: number }>(
              `SELECT TOP 1 1 AS Id FROM PrealertaSerial
               WHERE Serial = @serial AND PrealertaId = @prealertaId`,
              { serial: item.serial, prealertaId: data.prealertaId },
            );
            if (enMisma.length > 0) { yaExistian++; return; }

            // Insertar con Caja = NULL (Disponible)
            await execQuery(
              `INSERT INTO PrealertaSerial
                (PrealertaId, Serial, Mac, CodigoSap, Descripcion, Cantidad, Caja, Falla,
                 TecnicoCliente, Pedido, Tramite, Novedad, Garantia, Tipo)
               VALUES
                (@prealertaId, @serial, @mac, @codigoSap, @descripcion, 1, 0, '',
                 '', '', @tramite, '', 0, 'Serializable')`,
              {
                prealertaId: data.prealertaId,
                serial: item.serial,
                mac: item.mac ?? "",
                codigoSap: item.codigoSap ?? "",
                descripcion: item.descripcion ?? "",
                tramite: item.tramite ?? "Sincronizado",
              },
            );
            insertados++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("Error guardando serial disponible:", item.serial, err);
            errores.push(`${item.serial}: ${msg}`);
            fallidos++;
          }
        }),
      );
    }

    return { insertados, yaExistian, enOtraPrealerta, fallidos, errores };
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

  async updatePrealertNombre(id: number, nombre: string): Promise<void> {
    const pool = await getDBConnection();
    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("Nombre", sql.VarChar(50), nombre.slice(0, 50))
      .query("UPDATE Prealerta SET Nombre = @Nombre WHERE Id = @Id");
  },

  async deletePrealert(id: number): Promise<{ success: boolean }> {
    // Usamos execProc para ejecutar el procedimiento de borrado
    // No necesitamos el resultado, así que solo esperamos la ejecución
    await execProc("pa_DeletePrealert", {
      Id: { type: sql.Int, value: id },
    });

    return { success: true };
  },
  async getSerialsSinSap(prealertaId: number) {
    return execQuery<{ Id: number; Serial: string }>(
      `SELECT Id, Serial FROM PrealertaSerial
       WHERE PrealertaId = @prealertaId
         AND Tipo <> 'No-serializable'
         AND (Serial IS NOT NULL AND Serial <> '')
         AND (CodigoSap IS NULL OR CodigoSap = '' OR Descripcion IS NULL OR Descripcion = '')`,
      { prealertaId },
    );
  },

  async actualizarCodigoSapSerial(
    id: number,
    codigoSap: string,
    descripcion: string,
  ) {
    await execQuery(
      `UPDATE PrealertaSerial
          SET CodigoSap = @codigoSap, Descripcion = @descripcion
        WHERE Id = @id`,
      { id, codigoSap, descripcion },
    );
  },

  async getCodigosSap(): Promise<Map<string, string>> {
    const rows = await execQuery<{ codigo: string; Descripcion: string }>(
      "SELECT codigo, Descripcion FROM CodigoSap",
    );
    return new Map(rows.map((r) => [r.codigo, r.Descripcion ?? ""]));
  },

  /**
   * Para cada serial de la prealerta:
   *   1. Si ya tiene CodigoSap pero Descripcion vacía → busca la descripción por ese código SAP.
   *   2. Si no tiene CodigoSap → intenta si el valor del Serial coincide con algún código SAP.
   * En ambos casos actualiza Descripcion (y CodigoSap si aplica) en PrealertaSerial.
   */
  async sincronizarConCodigoSap(prealertaId: number): Promise<{ actualizados: number }> {
    const seriales = await execQuery<{
      Id: number;
      Serial: string;
      CodigoSap: string | null;
    }>(
      `SELECT Id, Serial, CodigoSap FROM PrealertaSerial
       WHERE PrealertaId = @prealertaId
         AND (Serial IS NOT NULL AND Serial <> '')
         AND (
               -- Tiene CodigoSap pero falta descripción
               (CodigoSap IS NOT NULL AND CodigoSap <> ''
                AND (Descripcion IS NULL OR Descripcion = ''))
               -- O no tiene CodigoSap para nada
               OR (CodigoSap IS NULL OR CodigoSap = '')
             )`,
      { prealertaId },
    );

    if (seriales.length === 0) return { actualizados: 0 };

    const sapMap = await AgentesBackendService.getCodigosSap();

    let actualizados = 0;
    for (const row of seriales) {
      // Caso 1: ya tiene código SAP → busca solo la descripción
      if (row.CodigoSap && row.CodigoSap.trim() !== "") {
        const desc = sapMap.get(row.CodigoSap.trim());
        if (desc !== undefined) {
          await execQuery(
            `UPDATE PrealertaSerial SET Descripcion = @descripcion WHERE Id = @id`,
            { id: row.Id, descripcion: desc },
          );
          actualizados++;
        }
        continue; // pasa al siguiente serial independientemente
      }

      // Caso 2: sin CodigoSap → intenta si el serial mismo es un código SAP
      const descPorSerial = sapMap.get(row.Serial.trim());
      if (descPorSerial !== undefined) {
        await execQuery(
          `UPDATE PrealertaSerial
              SET CodigoSap = @codigo, Descripcion = @descripcion
            WHERE Id = @id`,
          { id: row.Id, codigo: row.Serial.trim(), descripcion: descPorSerial },
        );
        actualizados++;
      }
    }

    return { actualizados };
  },

  async getCodigosSapList(): Promise<{ codigo: string; descripcion: string }[]> {
    const rows = await execQuery<{ codigo: string; Descripcion: string }>(
      "SELECT codigo, Descripcion FROM CodigoSap ORDER BY codigo ASC",
    );
    return rows.map((r) => ({ codigo: r.codigo, descripcion: r.Descripcion ?? "" }));
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

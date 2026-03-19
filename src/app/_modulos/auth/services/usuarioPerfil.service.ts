import sql from "mssql";
import { getDBConnection } from "../../../../lib/db";

export const UsuarioPerfilService = {
  async getFullUserProfile(usuarioId: number, clienteNombre: string) {
    try {
      const pool = await getDBConnection(true);

      // PASO 1: obtener usuarioClienteId
      const resultUC = await pool
        .request()
        .input("UId", sql.Int, usuarioId)
        .input("CName", sql.VarChar(100), clienteNombre).query(`
                    SELECT uc.id 
                    FROM WmsWdGeneral.dbo.UsuarioCliente uc
                    INNER JOIN WmsWdGeneral.dbo.Cliente c ON uc.clienteId = c.id
                    WHERE uc.usuarioId = @UId AND c.nombre = @CName
                `);

      console.log("🔎 PASO 1 - Buscando con:", { usuarioId, clienteNombre });
      console.log(
        "🔎 PASO 1 - Resultado SQL:",
        JSON.stringify(resultUC.recordset),
      );

      const usuarioClienteId = resultUC.recordset[0]?.id;
      console.log("🔎 usuarioClienteId encontrado:", usuarioClienteId);

      if (!usuarioClienteId) {
        throw new Error(
          `Relación no encontrada: Usuario ${usuarioId} no está asociado a ${clienteNombre}`,
        );
      }

      // PASO 2: SP intacto - obtener perfilNombre
      const resultPerfil = await pool
        .request()
        .input("usuarioClienteId", sql.Int, usuarioClienteId)
        .execute("WmsWdGeneral.dbo.pa_GetNameProfile");

      console.log(
        "🔎 PASO 2 - Recordset del SP:",
        JSON.stringify(resultPerfil.recordset),
      );

      const perfilRow = resultPerfil.recordset[0];

      // PASO 3: query separada - obtener perfilId numérico para el menú
      const resultPerfilId = await pool
        .request()
        .input("UsuarioClienteId", sql.Int, usuarioClienteId).query(`
                    SELECT p.id
                    FROM WmsWdGeneral.dbo.Perfil p 
                    INNER JOIN WmsWdGeneral.dbo.UsuarioClientePerfil ucp ON ucp.perfilId = p.id 
                    INNER JOIN WmsWdGeneral.dbo.UsuarioCliente uc ON ucp.usuarioClienteId = uc.id 
                    WHERE uc.id = @UsuarioClienteId
                `);

      console.log(
        "🔎 PASO 3 - perfilId:",
        JSON.stringify(resultPerfilId.recordset),
      );

      const perfilId = resultPerfilId.recordset[0]?.id;

      return {
        usuarioClienteId,
        perfilId, // 👈 ej. 1499
        perfilNombre: perfilRow?.nombre || perfilRow?.perfil || "USUARIO",
      };
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Error desconocido en UsuarioPerfilService";
      console.error("❌ Error en SQL Perfil:", msg);
      throw new Error(msg);
    }
  },
};

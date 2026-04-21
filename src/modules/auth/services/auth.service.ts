import sql from "mssql";
import { getDBConnection } from "../../../../lib/db";
import { UsuarioModel } from "../models/UsuarioModel";

export const AuthBackendService = {
  async getUsuarioModel(
    nombreUsuario: string,
    clave: string,
  ): Promise<UsuarioModel | null> {
    try {
      const pool = await getDBConnection();

      // 🔐 LA CLAVE REAL: Convertir el texto a Base64 puro
      // Basado en tu JSON, la clave es el identificador en Base64
      const claveBase64 = Buffer.from(clave).toString("base64");

      console.log(`🚀 Intentando login para: ${nombreUsuario}`);
      console.log(`🔑 Clave enviada: ${clave} -> Base64: ${claveBase64}`);

      const result = await pool
        .request()
        .input("NombreUsuario", sql.VarChar(50), nombreUsuario)
        .input("Clave", sql.NVarChar(1000), claveBase64)
        .execute("pa_GetModelUser");

      if (result.recordset && result.recordset.length > 0) {
        console.log(`✅ Usuario ${nombreUsuario} validado con éxito.`);
        return result.recordset[0] as UsuarioModel;
      }

      return null;
    } catch (error) {
      console.error("❌ Error en AuthBackendService.getUsuarioModel:", error);
      throw error;
    }
  },

  async getIdUser(nombreUsuario: string): Promise<number | null> {
    try {
      const pool = await getDBConnection();
      const result = await pool
        .request()
        .input("NombreUsuario", sql.VarChar(50), nombreUsuario)
        .execute("pa_GetIdUser");

      return result.recordset[0]?.id || result.recordset[0]?.Id || null;
    } catch (error) {
      console.error("❌ Error en AuthBackendService.getIdUser:", error);
      throw error;
    }
  },
};

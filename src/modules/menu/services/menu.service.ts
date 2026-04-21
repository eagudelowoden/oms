import sql from "mssql";
import { getDBConnection } from "../../../../lib/db";

export interface MenuItem {
  id: string;
  descripcion: string;
  tipo: string;
  orden: number;
  accion: string;
  estado: string;
  icono: string;
  id_padre: string;
  view_name: string;
  controller_name: string;
  children?: MenuItem[];
}

const ROOT_EXCLUDE = new Set(["ADM", "INF", "ORD"]);
const INV_EXCLUDE = new Set(["ICIC"]);
const LOG_EXCLUDE = new Set(["LSEP", "LSCR"]);
const PROD_EXCLUDE = new Set(["PINN", "PSMART"]);

function applyFilters(items: MenuItem[], parentId: string): MenuItem[] {
  if (parentId === "0") return items.filter((i) => !ROOT_EXCLUDE.has(i.id));
  if (parentId === "INV") return items.filter((i) => !INV_EXCLUDE.has(i.id));
  if (parentId === "LOG") return items.filter((i) => !LOG_EXCLUDE.has(i.id));
  if (parentId === "PROD") return items.filter((i) => !PROD_EXCLUDE.has(i.id));
  return items;
}

export const MenuService = {
  async getMenuByPerfilAndPadre(
    idPerfil: number,
    idPadre: string,
  ): Promise<MenuItem[]> {
    try {
      const pool = await getDBConnection(); // 👈 sin true, usa BD del cliente

      const result = await pool
        .request()
        .input("idPerfil", sql.Int, idPerfil)
        .input("id", sql.VarChar(50), idPadre).query(`
          SELECT m.id, m.descripcion, m.tipo, m.orden, m.accion, 
                 m.estado, m.icono, m.id_padre, m.view_name, m.controller_name
          FROM Menu m
          INNER JOIN menu_perfil mp ON m.Id = mp.IdMenu 
            AND mp.IdPerfil = @idPerfil
          WHERE m.id_padre = @id
          ORDER BY m.orden ASC
        `);

      return applyFilters(result.recordset as MenuItem[], idPadre);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error en MenuService";
      console.error("❌ Error en MenuService:", msg);
      throw new Error(msg);
    }
  },
};

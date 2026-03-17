import sql from 'mssql';
import { getDBConnection } from '../../../../lib/db';

export const UsuarioPerfilService = {
    async getFullUserProfile(usuarioId: number, clienteNombre: string) {
        try {
            const pool = await getDBConnection(true);

            // PASO 1: Buscar el ID de relación (usuarioClienteId)
            // Usamos la ruta completa para evitar "Invalid object name"
            const resultUC = await pool.request()
                .input('UId', sql.Int, usuarioId)
                .input('CName', sql.VarChar(100), clienteNombre)
                .query(`
          SELECT uc.id 
          FROM WmsWdGeneral.dbo.UsuarioCliente uc
          INNER JOIN WmsWdGeneral.dbo.Cliente c ON uc.clienteId = c.id
          WHERE uc.usuarioId = @UId AND c.nombre = @CName
        `);

            const usuarioClienteId = resultUC.recordset[0]?.id;

            if (!usuarioClienteId) {
                throw new Error(`No existe relación para el usuario ${usuarioId} en el cliente ${clienteNombre}`);
            }

            // PASO 2: Ejecutar el SP con el ID de la relación (ej. el 6592)
            const resultPerfil = await pool.request()
                .input('usuarioClienteId', sql.Int, usuarioClienteId)
                .execute('WmsWdGeneral.dbo.pa_GetNameProfile');

            const perfilRow = resultPerfil.recordset[0];

            return {
                usuarioClienteId: usuarioClienteId,
                // Tu SP hace 'SELECT p.nombre', así que mapeamos .nombre
                perfilNombre: perfilRow?.nombre || perfilRow?.perfil || "USUARIO"
            };

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error en UsuarioPerfilService";
            console.error('❌ Error detallado:', msg);
            throw new Error(msg);
        }
    }
};
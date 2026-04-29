import sql from 'mssql';
import { getDBConnection } from '../../../../lib/db';

export const UsuarioPerfilService = {
    async getFullUserProfile(usuarioId: number, clienteNombre: string) {
        try {
            const pool = await getDBConnection(true);

            const resultUC = await pool.request()
                .input('UId', sql.Int, usuarioId)
                .input('CName', sql.VarChar(100), clienteNombre)
                .query(`
                    SELECT uc.id 
                    FROM WmsWdGeneral.dbo.UsuarioCliente uc
                    INNER JOIN WmsWdGeneral.dbo.Cliente c ON uc.clienteId = c.id
                    WHERE uc.usuarioId = @UId AND c.nombre = @CName
                `);

            console.log('🔎 PASO 1 - Buscando con:', { usuarioId, clienteNombre });
            console.log('🔎 PASO 1 - Resultado SQL:', JSON.stringify(resultUC.recordset));

            const usuarioClienteId = resultUC.recordset[0]?.id;
            console.log('🔎 usuarioClienteId encontrado:', usuarioClienteId);

            if (!usuarioClienteId) {
                throw new Error(`Relación no encontrada: Usuario ${usuarioId} no está asociado a ${clienteNombre}`);
            }

            const resultPerfil = await pool.request()
                .input('usuarioClienteId', sql.Int, usuarioClienteId)
                .execute('WmsWdGeneral.dbo.pa_GetNameProfile');

            console.log('🔎 PASO 2 - Recordset del SP:', JSON.stringify(resultPerfil.recordset));

            const perfilRow = resultPerfil.recordset[0];

            return {
                usuarioClienteId: usuarioClienteId,
                perfilNombre: perfilRow?.nombre || perfilRow?.perfil || "USUARIO"
            };

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error desconocido en UsuarioPerfilService";
            console.error('❌ Error en SQL Perfil:', msg);
            throw new Error(msg);
        }
    }
};
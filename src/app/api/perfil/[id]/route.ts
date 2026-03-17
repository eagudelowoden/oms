import sql from 'mssql';
import { getDBConnection } from '../../../../lib/db';

export const UsuarioPerfilService = {
    async getFullUserProfile(usuarioId: number, clienteNombre: string) {
        try {
            // 1. Obtenemos la conexión (True para usar la DB General/Admin)
            const pool = await getDBConnection(true);

            // PASO 1: Replicamos 'obtenerUsuarioClienteId' de Angular
            // Buscamos el ID (ej. 6592) usando el usuarioId (ej. 5321) y el nombre del cliente
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
                throw new Error(`Relación no encontrada: Usuario ${usuarioId} no está asociado a ${clienteNombre}`);
            }

            // PASO 2: Replicamos 'perfilService.getPerfil(6592)'
            // Ejecutamos el SP con el ID de la relación obtenido arriba
            const resultPerfil = await pool.request()
                .input('usuarioClienteId', sql.Int, usuarioClienteId)
                .execute('WmsWdGeneral.dbo.pa_GetNameProfile');

            // Capturamos la primera fila del resultado
            const perfilRow = resultPerfil.recordset[0];

            return {
                usuarioClienteId: usuarioClienteId, // El 6592
                // Priorizamos 'nombre' porque tu SP hace: SELECT p.nombre ...
                perfilNombre: perfilRow?.nombre || perfilRow?.perfil || "USUARIO"
            };

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Error desconocido en UsuarioPerfilService";
            console.error('❌ Error en SQL Perfil:', msg);
            throw new Error(msg);
        }
    }
};
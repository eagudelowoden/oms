import { NextRequest, NextResponse } from 'next/server';
import { UsuarioPerfilService } from '../../../_modulos/auth/services/usuarioPerfil.service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // 👈 await aquí
        const { searchParams } = new URL(request.url);
        const clienteNombre = searchParams.get('clienteNombre');
        const usuarioId = parseInt(id);

        console.log('📥 Params recibidos:', { usuarioId, clienteNombre }); // 👈 agrega esto

        if (!clienteNombre || !usuarioId) {
            return NextResponse.json(
                { error: 'Faltan parámetros: clienteNombre y usuarioId son requeridos' },
                { status: 400 }
            );
        }

        const data = await UsuarioPerfilService.getFullUserProfile(usuarioId, clienteNombre);
        return NextResponse.json(data);

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
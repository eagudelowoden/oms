import { NextResponse } from 'next/server';
import { ClienteBackendService } from '../../../_modulos/auth/services/cliente.service';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// --- MANEJADOR GET (list e getId) ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { searchParams } = new URL(request.url);
  const { action } = await params;

  try {
    if (action === 'list') {
      const usuarioIdStr = searchParams.get('usuarioId');
      if (!usuarioIdStr) return NextResponse.json({ error: 'Falta usuarioId' }, { status: 400 });

      const usuarioId = parseInt(usuarioIdStr);
      const data = await ClienteBackendService.getListClient(usuarioId);
      return NextResponse.json(data);
    }

    if (action === 'getId') {
      const nombre = searchParams.get('nombre');
      if (!nombre) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });

      const id = await ClienteBackendService.getIdClient(nombre);
      return NextResponse.json(id);
    }

    return NextResponse.json({ error: 'Acción GET no válida' }, { status: 404 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    console.error("❌ Error en API Clientes (GET):", msg);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// --- MANEJADOR POST (switch) ---
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  if (action === 'switch') {
    try {
      const body = await request.json() as {
        clientId: number,
        clienteNombre: string,
        dbNameReal: string // Ahora es requerido para no inventar nombres
      };

      const { clientId, clienteNombre, dbNameReal } = body;

      // VALIDACIÓN: Si no hay dbNameReal de la base de datos, no procedemos
      if (!dbNameReal) {
        console.error("❌ Intento de switch sin dbNameReal para:", clienteNombre);
        return NextResponse.json({ error: 'Nombre de base de datos técnica no encontrado' }, { status: 400 });
      }

      // NO RENOMBRAR: Usamos el nombre original de la base de datos tal cual viene
      const dbName = dbNameReal;

      console.log(`🔄 Realizando switch a DB Original: ${dbName} (${clienteNombre})`);

      // 2. Firmar nuevo JWT con la DB técnica exacta (Ej: WmsWdTigoColombiaBOG)
      const token = jwt.sign(
        {
          clientId,
          dbName,
          clienteNombre,
          role: 'admin'
        },
        process.env.JWT_SECRET || 'oms_default_secret_2026',
        { expiresIn: '8h' }
      );

      // 3. Actualizar la Cookie
      const cookieStore = await cookies();
      cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 8,
        path: '/',
        sameSite: 'lax'
      });

      return NextResponse.json({
        clientToken: token,
        clientDb: dbName,
        clientDbName: clienteNombre
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ Error en API Clientes (POST switch):", msg);
      return NextResponse.json({ error: 'No se pudo procesar el cambio de cliente' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Acción POST no válida' }, { status: 404 });
}
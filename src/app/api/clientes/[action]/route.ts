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
  const { action } = await params; // Desenvolver params (Next.js 15)

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
  } catch (error) {
    console.error("Error en API Clientes (GET):", error);
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
      const { clientId, clienteNombre } = await request.json();

      // 1. Lógica para definir la DB (Ej: quitar espacios al nombre)
      const dbName = `WmsWd${clienteNombre.replace(/\s+/g, '')}`;

      // 2. Firmar nuevo JWT con la información de la base de datos del cliente
      const token = jwt.sign(
        { 
          clientId, 
          dbName, 
          clienteNombre,
          role: 'admin' // Opcional: traer del usuario real
        },
        process.env.JWT_SECRET || 'oms_default_secret_2026',
        { expiresIn: '8h' }
      );

      // 3. Actualizar la Cookie en el servidor
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
    } catch (error) {
      console.error("Error en API Clientes (POST):", error);
      return NextResponse.json({ error: 'Error en el switch' }, { status: 500 });
    }
  }
//
  return NextResponse.json({ error: 'Acción POST no válida' }, { status: 404 });
}
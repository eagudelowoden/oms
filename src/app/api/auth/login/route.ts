import { NextResponse } from 'next/server';
import { AuthBackendService } from '../../../_modulos/auth/services/auth.service';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers'; // <--- Importante para las cookies

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const usuario = await AuthBackendService.getUsuarioModel(username, password);

    if (!usuario) {
      return NextResponse.json(
        { message: 'Credenciales incorrectas o usuario inactivo' }, 
        { status: 401 }
      );
    }

    // Generar el JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        username: usuario.nombreUsuario,
        clientName: "WmsWdGeneral" 
      },
      process.env.JWT_SECRET || 'oms_default_secret_2026',
      { expiresIn: '8h' }
    );

    // 🍪 SETEAR COOKIE EN EL SERVIDOR
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,    // Protege contra ataques XSS
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 60 * 60 * 8, // 8 horas (igual que el JWT)
      path: '/',         // Disponible en toda la app
      sameSite: 'lax',
    });

    return NextResponse.json({
      token,
      usuarioId: usuario.id.toString(),
      usuario: usuario,
      message: 'Inicio de sesión exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
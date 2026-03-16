import { NextResponse } from 'next/server';
import { AuthBackendService } from '../../../_modulos/auth/services/auth.service';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Validar contra SQL Server usando el SP
    const usuario = await AuthBackendService.getUsuarioModel(username, password);

    if (!usuario) {
      return NextResponse.json(
        { message: 'Credenciales incorrectas o usuario inactivo' },
        { status: 401 }
      );
    }

    /**
     * 2. Generar el JWT
     * En tu Spring Boot original, el token incluía: clientName, clientDb y clientId.
     * Los agregamos aquí para mantener la compatibilidad con tu JwtUtil de Java.
     */
    const token = jwt.sign(
      {
        sub: usuario.nombreUsuario, // 'sub' es estándar para el username
        id: usuario.id,
        clientName: "WmsWdGeneral",
        clientDb: "WmsWdGeneral",
        clientId: 0
      },
      process.env.JWT_SECRET || 'oms_default_secret_2026',
      { expiresIn: '8h' }
    );

    /**
     * 3. Respuesta idéntica a la original
     * Tu Angular usa response.usuarioId (como string) y espera el objeto 'usuario'.
     */
    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      usuarioId: usuario.id.toString(), // Importante: Spring Boot lo mandaba como String
      token: token,
      usuario: usuario
    });

  } catch (error) {
    console.error('❌ Error en el proceso de Login:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
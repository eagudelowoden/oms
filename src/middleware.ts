import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Aquí puedes verificar si existe una cookie de sesión o el token
  // Por ahora, solo dejaremos el esqueleto para que lo expandamos luego
  const { pathname } = request.nextUrl;

  // Si intentan ir a /admin sin estar logueados (esto es un ejemplo básico)
  // Nota: localStorage no funciona en middleware, usaremos cookies después.

  return NextResponse.next();
}

// Configura qué rutas debe vigilar el middleware
export const config = {
  matcher: ['/admin/:path*'],
};
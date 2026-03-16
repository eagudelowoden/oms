import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Intentamos obtener el token de las cookies
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 2. PROTECCIÓN: Si intenta ir a /admin sin token
  if (pathname.startsWith('/admin')) {
    if (!token) {
      console.warn(`🚫 Acceso denegado a ${pathname}. Redirigiendo a login.`);
      // Redirigimos al login y guardamos la página a la que quería ir en un parámetro 'callback'
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  // 3. LOGUEADO: Si el usuario ya tiene token e intenta entrar al /login, mandarlo al dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Configura qué rutas debe vigilar el middleware
export const config = {
  matcher: [
    '/admin/:path*', // Protege todo lo que empiece por /admin
    '/login'         // Monitorea el login para evitar re-logueos
  ],
};
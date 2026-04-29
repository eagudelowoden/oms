import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Obtenemos el token y validamos estrictamente su contenido
  const cookieToken = request.cookies.get('token')?.value;

  // Validamos que exista y que no sea basura como "undefined" o "null" en string
  const hasToken = cookieToken &&
    cookieToken !== 'undefined' &&
    cookieToken !== 'null' &&
    cookieToken.trim() !== '';

  const { pathname } = request.nextUrl;

  // BASE URL DINÁMICA: Vital para que ngrok y localhost no choquen
  const host = request.headers.get('host') || request.nextUrl.host;
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  // 2. CASO: Acceso a /admin sin token válido
  if (pathname.startsWith('/admin')) {
    if (!hasToken) {
      console.warn(`🚫 Acceso denegado a ${pathname}. Limpiando y redirigiendo.`);

      const loginUrl = new URL('/login', baseUrl);
      loginUrl.searchParams.set('callback', pathname);

      const response = NextResponse.redirect(loginUrl);

      // CAMBIO CLAVE: Si el token no es válido, lo borramos del navegador 
      // para evitar que el middleware se confunda en la siguiente petición.
      response.cookies.delete('token');
      return response;
    }
  }

  // 3. CASO: Usuario logueado intentando entrar al /login
  if (pathname === '/login' && hasToken) {
    console.log(`✅ Usuario con sesión activa detectado. Mandando a /admin.`);
    return NextResponse.redirect(new URL('/admin', baseUrl));
  }

  return NextResponse.next();
}

// Configuración de rutas
export const config = {
  matcher: [
    '/admin/:path*',
    '/login'
  ],
};
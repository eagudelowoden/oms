import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Eliminamos la cookie del token
  cookieStore.delete('token');

  return NextResponse.json({ 
    message: 'Sesión cerrada correctamente' 
  }, { status: 200 });
}
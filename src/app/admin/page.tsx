'use client';

import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        localStorage.clear();
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    // Forzamos clases de fondo claro explícitamente para evitar el "daño" visual
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="p-8">
        <header className="flex justify-between items-center bg-white p-4 shadow-sm rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg"></div>
            <h1 className="text-xl font-bold tracking-tight">WMS Dashboard</h1>
          </div>
          
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium transition-all active:scale-95 shadow-sm"
          >
            Cerrar Sesión
          </button>
        </header>

        <main className="mt-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-2">Panel Principal</h2>
            <p className="text-gray-600">
              Bienvenido, Daniel. El sistema está conectado y listo.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
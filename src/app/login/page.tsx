'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

interface LoginFormInputs {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>();

  // Sincronización Real del Modo
  useEffect(() => {
    // Verificamos si la clase 'dark' existe en el HTML al cargar
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('usuario', JSON.stringify(result.usuario));
        router.push('/admin');
      } else {
        setError(result.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      
      {/* Botón Switch Compacto Mejorado */}
      <button 
        type="button"
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all z-50"
      >
        <span className="material-symbols-rounded text-xl block text-amber-500 dark:text-blue-400">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="w-full max-w-[340px] sm:max-w-[360px]">
        {/* Logo Compacto */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="material-symbols-rounded text-white text-xl font-bold">warehouse</span>
          </div>
          <h2 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase">
            OMS Logistics
          </h2>
        </div>

        {/* Card de Login Compacta */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] shadow-xl border border-slate-100 dark:border-slate-800/50">
          <div className="mb-5">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Bienvenido</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Acceso al sistema</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 p-3 text-[11px] bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/20">
                <span className="material-symbols-rounded text-base">error</span>
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Usuario</label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-lg">person</span>
                <input
                  {...register('username', { required: true })}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.agudelo"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-lg">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: true })}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors"
                >
                  <span className="material-symbols-rounded text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>INGRESAR</span>
                  <span className="material-symbols-rounded text-base">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-6 text-center text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em]">
          OMS Logistics &bull; v1.0
        </p>
      </div>
    </div>
  );
}
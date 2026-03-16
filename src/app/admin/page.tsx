'use client';

import { useState } from "react";

// Definimos la interfaz para evitar errores de TypeScript
interface Usuario {
  nombre: string;
  rol: string;
}

export default function AdminPage() {
  // 1. Inicializamos el estado directamente leyendo localStorage.
  // Esto evita el error de "setState synchronously within an effect".
  const [usuario] = useState<Usuario | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("usuario");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      {/* Encabezado del Dashboard */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '900', 
          color: 'var(--text-main)', 
          margin: 0,
          letterSpacing: '-0.04em' 
        }}>
          Panel de Control
        </h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Bienvenido, <span style={{ color: '#2563eb', fontWeight: '700' }}>{usuario?.nombre || 'Admin'}</span>. El sistema está operativo.
        </p>
      </div>

      {/* Grid de Tarjetas de Resumen */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="material-symbols-rounded icon-blue">inventory_2</span>
          <div>
            <p className="label">Stock Total</p>
            <p className="value">1,284</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-rounded icon-green">local_shipping</span>
          <div>
            <p className="label">Salidas Hoy</p>
            <p className="value">42</p>
          </div>
        </div>

        <div className="stat-card">
          <span className="material-symbols-rounded icon-orange">verified_user</span>
          <div>
            <p className="label">Rol Activo</p>
            <p className="value" style={{ fontSize: '1rem', color: '#f59e0b' }}>{usuario?.rol || 'N/A'}</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .stat-card {
          background: var(--bg-card);
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: transform 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
        }
        .material-symbols-rounded {
          font-size: 32px;
          padding: 12px;
          border-radius: 12px;
        }
        .icon-blue { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .icon-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .icon-orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0; }
        .value { font-size: 1.5rem; font-weight: 800; color: var(--text-main); margin: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
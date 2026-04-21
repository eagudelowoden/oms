import React, { useEffect, useState } from "react";
import styles from "../prealerta.module.css";

interface Sede {
  id: number;
  nombre: string;
}

interface Props {
  onCrear: (sedeId: number, sedeNombre: string) => void;
}

export default function PrealertaHeader({ onCrear }: Props) {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<number | "">("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/prealerta/sedes")
      .then((r) => r.json())
      .then((data) => {
        setSedes(data);
        if (data.length > 0) setSedeSeleccionada(data[0].id);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const handleCrear = () => {
    if (!sedeSeleccionada) return;
    const sede = sedes.find((s) => s.id === sedeSeleccionada);
    if (sede) onCrear(sede.id, sede.nombre);
  };

  return (
    <div className={styles.header}>
      <h2 className={styles.headerTitle}>Historial Pre-Alerta Agente</h2>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <select
          value={sedeSeleccionada}
          onChange={(e) => setSedeSeleccionada(Number(e.target.value))}
          disabled={cargando}
          className={styles.selectSede}
        >
          {cargando && <option>Cargando sedes...</option>}
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.btnNew}
          onClick={handleCrear}
          disabled={!sedeSeleccionada || cargando}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="5.5" />
            <line x1="7" y1="4.2" x2="7" y2="9.8" />
            <line x1="4.2" y1="7" x2="9.8" y2="7" />
          </svg>
          Crear prealerta
        </button>
      </div>
    </div>
  );
}

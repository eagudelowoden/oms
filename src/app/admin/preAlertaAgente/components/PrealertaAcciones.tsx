import React, { useRef } from "react";
import styles from "../prealerta.module.css";
import { PrealertaItem } from "../hooks/usePrealerta";

interface Props {
  seleccionada: PrealertaItem | null;
  onClearSeleccion: () => void;
  onAbrirScanner: () => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
  onSincronizar: (fecha: string) => void;
  sincronizando: boolean;
}

export default function PrealertaAcciones({
  seleccionada,
  onClearSeleccion,
  onAbrirScanner,
  onShowToast,
  onSincronizar,
  sincronizando,
}: Props) {
  const fechaRef = useRef<HTMLInputElement>(null);

  const handleSincronizar = () => {
    const fecha = fechaRef.current?.value;
    if (!fecha) {
      onShowToast("Selecciona una fecha de proceso primero", "error");
      return;
    }
    onSincronizar(fecha);
  };

  return (
    <>
      {/* Botones carga + fecha */}
      <div className={styles.midRow}>
        <div className={styles.uploadGroup}>
          {/* ── Sincronizar desde API ── */}
          <button
            type="button"
            className={styles.btnUpload}
            onClick={handleSincronizar}
            disabled={sincronizando}
            style={
              sincronizando
                ? { opacity: 0.7, cursor: "not-allowed" }
                : undefined
            }
          >
            {sincronizando ? (
              /* spinner SVG simple */
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: "spin 0.8s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 10V4M5 7l3-3 3 3" />
                <path d="M2 12.5h12" />
              </svg>
            )}
            {sincronizando ? "Sincronizando…" : "Sincronizar Datos"}
          </button>

          {/* ── Escanear / Carga manual ── */}
          <button
            type="button"
            className={`${styles.btnManual} ${!seleccionada ? styles.btnManualDisabled : ""}`}
            onClick={() => {
              if (!seleccionada) {
                onShowToast("Selecciona una prealerta primero", "error");
                return;
              }
              onAbrirScanner();
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <rect x="1" y="1" width="5" height="5" rx="1" />
              <rect x="10" y="1" width="5" height="5" rx="1" />
              <rect x="1" y="10" width="5" height="5" rx="1" />
              <path d="M10 10h2v2h-2zM12 12h3M12 10h3M10 12v3" />
            </svg>
            {seleccionada ? "Escanear seriales" : "Carga manual"}
          </button>
        </div>

        {/* ── Fecha proceso ── */}
        <div className={styles.fechaCard}>
          <label htmlFor="fechaProceso" className={styles.fechaLabel}>
            Fecha Proceso
          </label>
          <input
            id="fechaProceso"
            ref={fechaRef}
            type="date"
            className={styles.fechaInput}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      {/* keyframe spin inline para el loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

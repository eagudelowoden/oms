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
  onSincronizarAccesorios: (fecha?: string) => void; // ← NUEVA
  sincronizandoAccesorios: boolean; // ← NUEVA
  onEmpacar: () => void;
  empacando: boolean;
  progreso: number;
  cajaActual: number;
  onCajaChange: (caja: number) => void;
  onDesempacar: () => void;
}

export default function PrealertaAcciones({
  seleccionada,
  onClearSeleccion,
  onAbrirScanner,
  onShowToast,
  onSincronizar,
  sincronizando,
  onEmpacar,
  empacando,
  progreso,
  cajaActual,
  onCajaChange,
  onDesempacar,
  onSincronizarAccesorios,
  sincronizandoAccesorios,
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
  const handleSincronizarAccesorios = () => {
    const fecha = fechaRef.current?.value;
    onSincronizarAccesorios(fecha ?? undefined);
  };

  return (
    <>
      <div className={styles.midRow}>
        {/* ── Fecha proceso ── */}
        <div className={styles.fechaCard}>
          <label htmlFor="fechaProceso" className={styles.fechaLabel}>
            Fecha
          </label>
          <input
            id="fechaProceso"
            ref={fechaRef}
            type="date"
            className={styles.fechaInput}
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className={styles.uploadGroup}>
          {/* ── Sincronizar ── */}
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
            {sincronizando ? "Sincronizando…" : "Sincronizar Seriales"}
          </button>
          <button
            type="button"
            className={styles.btnUpload}
            onClick={handleSincronizarAccesorios}
            disabled={sincronizandoAccesorios}
            style={
              sincronizandoAccesorios
                ? { opacity: 0.7, cursor: "not-allowed" }
                : undefined
            }
          >
            {sincronizandoAccesorios ? (
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
            {sincronizandoAccesorios
              ? "Sincronizando…"
              : "Sincronizar Accesorios"}
          </button>
          {/* ── Carga manual ── */}
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
            {seleccionada ? "Escanear" : "Carga manual"}
          </button>

          <div className={styles.cajaWrapper}>
            <label className={styles.cajaLabel}>Caja</label>
            <input
              type="number"
              min={1}
              className={styles.cajaInput}
              value={cajaActual}
              onChange={(e) => onCajaChange(Number(e.target.value))}
              disabled={empacando}
            />
          </div>

          <button
            type="button"
            className={styles.btnEmpacar}
            onClick={onEmpacar}
            disabled={empacando}
          >
            {empacando ? `${progreso}%` : "Empacar"}
          </button>

          {/* ── Desempacar ── */}

          <button
            type="button"
            className={styles.btnDesempacar}
            onClick={onDesempacar}
          >
            Desempacar
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

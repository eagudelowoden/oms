import React from "react";
import styles from "../prealerta.module.css";
import { PrealertaItem } from "../hooks/usePrealerta";

interface Props {
  seleccionada: PrealertaItem | null;
  onClearSeleccion: () => void;
  onAbrirScanner: () => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
}

export default function PrealertaAcciones({
  seleccionada,
  onClearSeleccion,
  onAbrirScanner,
  onShowToast,
}: Props) {
  return (
    <>
      {/* Banner prealerta seleccionada */}
      {/* {seleccionada && (
        <div className={styles.selectedBanner}>
          <div className={styles.selectedLeft}>
            <span className={styles.selectedDot} />
            <span className={styles.selectedLabel}>Prealerta activa:</span>
            <span className={styles.selectedNombre}>{seleccionada.nombre}</span>
          </div>
          <button
            type="button"
            className={styles.selectedClear}
            onClick={onClearSeleccion}
          >
            ✕
          </button>
        </div>
      )} */}

      {/* Botones carga + fecha */}
      <div className={styles.midRow}>
        <div className={styles.uploadGroup}>
          <button type="button" className={styles.btnUpload}>
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
            Sincronizar Datos
          </button>
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
        <div className={styles.fechaCard}>
          <label htmlFor="fechaProceso" className={styles.fechaLabel}>
            Fecha Proceso
          </label>
          <input id="fechaProceso" type="date" className={styles.fechaInput} />
        </div>
      </div>
    </>
  );
}

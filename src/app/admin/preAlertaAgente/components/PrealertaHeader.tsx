import React from "react";
import styles from "../prealerta.module.css";

interface Props {
  onCrear: () => void;
}

export default function PrealertaHeader({ onCrear }: Props) {
  return (
    <div className={styles.header}>
      <h2 className={styles.headerTitle}>Historial Pre-Alerta Agente</h2>
      <button type="button" className={styles.btnNew} onClick={onCrear}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="7" cy="7" r="5.5"/>
          <line x1="7" y1="4.2" x2="7" y2="9.8"/>
          <line x1="4.2" y1="7" x2="9.8" y2="7"/>
        </svg>
        Crear prealerta
      </button>
    </div>
  );
}

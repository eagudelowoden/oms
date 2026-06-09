"use client";

import React from "react";
import styles from "../css/programar.module.css";

interface Props {
  fecha: string;
  onFechaChange: (v: string) => void;
  onProgramar: () => void;
  onDesprogramar: () => void;
  isPending: boolean;
}

export default function FechaAcciones({
  fecha,
  onFechaChange,
  onProgramar,
  onDesprogramar,
  isPending,
}: Props) {
  return (
    <div className={styles.accionesRow}>
      <div className={styles.fechaCard}>
        <span className={styles.fechaLabel}>Fecha</span>
        <input
          type="date"
          className={styles.fechaInput}
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
        />
      </div>

      <button
        className={styles.btnProgramar}
        onClick={onProgramar}
        disabled={isPending}
      >
        {isPending ? "Procesando..." : "Programar"}
      </button>

      <button
        className={styles.btnDesprogramar}
        onClick={onDesprogramar}
        disabled={isPending}
      >
        Desprogramar
      </button>
    </div>
  );
}

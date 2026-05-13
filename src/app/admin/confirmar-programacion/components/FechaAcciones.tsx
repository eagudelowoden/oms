"use client";

import React from "react";
import styles from "../css/confirmar.module.css";

interface Props {
  fecha: string;
  onFechaChange: (v: string) => void;
  onReprogramar: () => void;
  noAutorizacion: string;
  onNoAutorizacionChange: (v: string) => void;
  onAutorizar: () => void;
  isPending: boolean;
}

export default function FechaAcciones({
  fecha,
  onFechaChange,
  onReprogramar,
  noAutorizacion,
  onNoAutorizacionChange,
  onAutorizar,
  isPending,
}: Props) {
  return (
    <div className={styles.accionesCol}>
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
          className={styles.btnReprogramar}
          onClick={onReprogramar}
          disabled={isPending}
        >
          {isPending ? "Procesando..." : "Reprogramar"}
        </button>
      </div>

      <div className={styles.accionesRow}>
        <input
          type="text"
          className={styles.inputAutorizacion}
          placeholder="Ingrese no. autorización"
          value={noAutorizacion}
          onChange={(e) => onNoAutorizacionChange(e.target.value)}
        />
        <button
          className={styles.btnAutorizar}
          onClick={onAutorizar}
          disabled={isPending}
        >
          Autorizar
        </button>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import styles from "../css/confirmar-recepcion.module.css";
import { PrealertaRecepcionRow } from "@/app/services/confirmar-recepcion.service";

interface Props {
  seleccionada: PrealertaRecepcionRow | null;
  onConfirmar: () => void;
  isPending: boolean;
}

export default function Acciones({ seleccionada, onConfirmar, isPending }: Props) {
  return (
    <div className={styles.accionesCol}>
      <div className={styles.accionesRow}>
        <button
          className={styles.btnConfirmar}
          onClick={onConfirmar}
          disabled={!seleccionada || isPending}
        >
          {isPending ? "Procesando..." : "Confirmar Recepción"}
        </button>
        {seleccionada && (
          <span className={styles.selectedInfo}>
            Prealerta seleccionada: <strong>{seleccionada.nombre}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

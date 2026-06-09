"use client";

import React from "react";
import styles from "../css/confirmar-envio.module.css";
import { PrealertaEnvioRow } from "@/app/services/confirmar-envio.service";

interface Props {
  seleccionada: PrealertaEnvioRow | null;
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
          {isPending ? "Procesando..." : "Confirmar envío"}
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

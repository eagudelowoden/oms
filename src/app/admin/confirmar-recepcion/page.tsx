"use client";

import React from "react";
import styles from "./css/confirmar-recepcion.module.css";
import { useConfirmarRecepcion } from "./hooks/useConfirmarRecepcion";
import Acciones from "./components/Acciones";
import TablaPrealertas from "./components/TablaPrealertas";

export default function ConfirmarRecepcionPage() {
  const {
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    toast,
    isPending,
    handleConfirmar,
  } = useConfirmarRecepcion();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Confirmar recepción</h1>

      <Acciones
        seleccionada={seleccionada}
        onConfirmar={handleConfirmar}
        isPending={isPending}
      />

      <TablaPrealertas
        prealertas={prealertas}
        isLoading={isLoading}
        seleccionada={seleccionada}
        onSeleccionar={setSeleccionada}
        onRefresh={refetchPrealertas}
        onDeseleccionar={() => setSeleccionada(null)}
      />

      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "error" ? styles.toastError : styles.toastOk
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

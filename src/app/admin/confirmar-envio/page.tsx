"use client";

import React from "react";
import styles from "./css/confirmar-envio.module.css";
import { useConfirmarEnvio } from "./hooks/useConfirmarEnvio";
import Acciones from "./components/Acciones";
import TablaPrealertas from "./components/TablaPrealertas";

export default function ConfirmarEnvioPage() {
  const {
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    toast,
    isPending,
    handleConfirmar,
  } = useConfirmarEnvio();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Confirmar envío</h1>

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

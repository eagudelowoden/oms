"use client";

import React from "react";
import styles from "./css/confirmar.module.css";
import { useConfirmarProgramacion } from "./hooks/useConfirmarProgramacion";
import FechaAcciones from "./components/FechaAcciones";
import TablaPrealertas from "./components/TablaPrealertas";
import TablaMateriales from "./components/TablaMateriales";

export default function ConfirmarProgramacionPage() {
  const {
    fecha,
    setFecha,
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    materiales,
    cargandoMateriales,
    toast,
    isPending,
    noAutorizacion,
    setNoAutorizacion,
    observacion,
    setObservacion,
    handleReprogramar,
    handleAutorizar,
  } = useConfirmarProgramacion();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Confirmar programación</h1>

      <FechaAcciones
        fecha={fecha}
        onFechaChange={setFecha}
        onReprogramar={handleReprogramar}
        noAutorizacion={noAutorizacion}
        onNoAutorizacionChange={setNoAutorizacion}
        observacion={observacion}
        onObservacionChange={setObservacion}
        onAutorizar={handleAutorizar}
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

      <TablaMateriales
        materiales={materiales}
        cargando={cargandoMateriales}
      />

      <p className={styles.footerNote}>
        - Recuerde! Todos los materiales de su prealerta deben estar empacados
        para poder ser programados!
      </p>

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

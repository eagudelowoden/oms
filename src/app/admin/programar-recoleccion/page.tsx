"use client";

import React from "react";
import styles from "./css/programar.module.css";
import { useProgramarRecoleccion } from "./hooks/useProgramarRecoleccion";
import FechaAcciones from "./components/FechaAcciones";
import TablaPrealertas from "./components/TablaPrealertas";
import TablaMateriales from "./components/TablaMateriales";

export default function ProgramarRecoleccionPage() {
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
    handleProgramar,
    handleDesprogramar,
  } = useProgramarRecoleccion();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Programar recolección</h1>

      <FechaAcciones
        fecha={fecha}
        onFechaChange={setFecha}
        onProgramar={handleProgramar}
        onDesprogramar={handleDesprogramar}
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

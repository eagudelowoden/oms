"use client";

import React from "react";
import styles from "./css/consolidar-prealertas.module.css";
import { useConsolidarPrealertas } from "./hooks/useConsolidarPrealertas";
import TablaPrealertas from "./components/TablaPrealertas";
import { TablaMateriales, TablaAccesorios } from "./components/TablaMateriales";
import TablaConsolidadas from "./components/TablaConsolidadas";

export default function ConsolidarPrealertasPage() {
  const {
    prealertas,
    loadingPrealertas,
    refetchPrealertas,
    seleccionadas,
    toggleSeleccion,
    materiales,
    loadingMateriales,
    accesorios,
    loadingAccesorios,
    consolidadas,
    loadingConsolidadas,
    refetchConsolidadas,
    handleConsolidar,
    isPending,
    toast,
  } = useConsolidarPrealertas();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Consolidar prealertas</h1>

      <div className={styles.toolbar}>
        <button
          className={styles.btnPrecargar}
          onClick={() => refetchPrealertas()}
          disabled={loadingPrealertas}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
            download
          </span>
          Precargar prealerta
        </button>

        {seleccionadas.size > 0 && (
          <span className={styles.selInfo}>
            {seleccionadas.size} prealerta{seleccionadas.size !== 1 ? "s" : ""} seleccionada{seleccionadas.size !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <TablaPrealertas
        prealertas={prealertas}
        isLoading={loadingPrealertas}
        seleccionadas={seleccionadas}
        onToggle={toggleSeleccion}
        onRefresh={refetchPrealertas}
      />

      <TablaMateriales
        materiales={materiales}
        isLoading={loadingMateriales}
      />

      <TablaAccesorios
        accesorios={accesorios}
        isLoading={loadingAccesorios}
      />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          className={styles.btnConsolidar}
          onClick={handleConsolidar}
          disabled={isPending || seleccionadas.size < 2}
        >
          {isPending ? "Consolidando..." : "Consolidar"}
        </button>
      </div>

      <TablaConsolidadas
        consolidadas={consolidadas}
        isLoading={loadingConsolidadas}
        onRefresh={refetchConsolidadas}
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

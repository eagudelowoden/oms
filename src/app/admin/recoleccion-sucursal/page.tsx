"use client";

import React from "react";
import styles from "./css/recoleccion.module.css";
import { useRecoleccionSucursal } from "./hooks/useRecoleccionSucursal";
import StatsHeader from "./components/StatsHeader";
import TablaPrealertas from "./components/TablaPrealertas";
import TablaMateriales from "./components/TablaMateriales";
import TablaAccesorios from "./components/TablaAccesorios";
import MiniScannerCaptura from "@/app/admin/agentes/components/MiniScannerCaptura";

export default function RecoleccionSucursalPage() {
  const {
    prealertas,
    loadingPrealertas,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    seriales,
    loadingSeriales,
    accesorios,
    loadingAccesorios,
    serialesARecoger,
    serialesRecogidos,
    accesoriosARecoger,
    accesoriosRecogidos,
    scannerOpen,
    setScannerOpen,
    toast,
    handleScan,
    handleCerrarVerificacion,
    isPending,
  } = useRecoleccionSucursal();

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Recolección en sucursal</h1>

      <StatsHeader
        serialesARecoger={serialesARecoger}
        serialesRecogidos={serialesRecogidos}
        accesoriosARecoger={accesoriosARecoger}
        accesoriosRecogidos={accesoriosRecogidos}
      />

      <TablaPrealertas
        prealertas={prealertas}
        isLoading={loadingPrealertas}
        seleccionada={seleccionada}
        onSeleccionar={setSeleccionada}
        onRefresh={refetchPrealertas}
      />

      <TablaMateriales
        seriales={seriales}
        cargando={loadingSeriales}
        onEscanear={() => {
          if (!seleccionada) {
            return;
          }
          setScannerOpen(true);
        }}
      />

      <TablaAccesorios
        accesorios={accesorios}
        cargando={loadingAccesorios}
      />

      <div className={styles.footerBar}>
        <button
          className={styles.btnCerrar}
          onClick={handleCerrarVerificacion}
          disabled={isPending || !seleccionada}
        >
          Cerrar Verificación
        </button>
      </div>

      <div className={styles.footerNote}>
        <p>- Módulo obligatorio, sujeto a parametrización por cliente</p>
        <p>
          - Seriales que no coincidan en la verificación deben arrojar un mensaje
          &quot;Serial no reportado para recoger, informe al usuario de la sucursal que
          no puede transportarlo&quot;.
        </p>
      </div>

      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === "error" ? styles.toastError : styles.toastOk
          }`}
        >
          {toast.msg}
        </div>
      )}

      <MiniScannerCaptura
        isOpen={scannerOpen}
        onCapturar={(serial) => {
          setScannerOpen(false);
          handleScan(serial);
        }}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}

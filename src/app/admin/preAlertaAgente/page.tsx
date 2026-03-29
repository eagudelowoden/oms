"use client";

import React from "react";
import styles from "./prealerta.module.css";

import { usePrealerta } from "./hooks/usePrealerta";
import PrealertaHeader from "./components/PrealertaHeader";
import PrealertaTabla from "./components/PrealertaTabla";
import PrealertaAcciones from "./components/PrealertaAcciones";
import {
  PrealertaSeriales,
  PrealertaMaterial,
} from "./components/PrealertaGrid";
import { ConfirmModal, Toast } from "./components/PrealertaModals";
import ScannerModal from "../../_modulos/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/SincronizarModal";

export default function PreAlertaAgentePage() {
  const {
    isLoading,
    query,
    setQuery,
    sortCol,
    sortAsc,
    filteredAndSorted,
    scannerOpen,
    setScannerOpen,
    serialesEscaneados,
    handleRemoveSerial,
    confirmItem,
    setConfirmItem,
    preAlertaSeleccionada,
    setPreAlertaSeleccionada,
    toast,
    handleSort,
    handleCrearPrealerta,
    pedirConfirmacion,
    handleEliminar,
    handleSerialConfirm,
    handleEmpacar,
    showToast,
    empacando,
    progreso,
    sincronizando,
    sincronizarDesdeAPI,
    seleccionados,
    handleToggleSerial,
    handleToggleAll,
    modalSincronizar,
    setModalSincronizar,
  } = usePrealerta();

  return (
    <div className={styles.wrapper}>
      <PrealertaHeader onCrear={handleCrearPrealerta} />

      <PrealertaTabla
        isLoading={isLoading}
        items={filteredAndSorted}
        query={query}
        setQuery={setQuery}
        sortCol={sortCol}
        sortAsc={sortAsc}
        onSort={handleSort}
        seleccionada={preAlertaSeleccionada}
        onSeleccionar={setPreAlertaSeleccionada}
        onEliminar={pedirConfirmacion}
      />

      <PrealertaAcciones
        seleccionada={preAlertaSeleccionada}
        onClearSeleccion={() => setPreAlertaSeleccionada(null)}
        onAbrirScanner={() => setScannerOpen(true)}
        onShowToast={showToast}
        onSincronizar={() => setModalSincronizar(true)}
        sincronizando={sincronizando}
        onEmpacar={handleEmpacar} // ← nuevo
        empacando={empacando} // ← nuevo
        progreso={progreso} // ← nuevo
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      <div className={styles.bottomGrid}>
        <PrealertaSeriales
          seriales={serialesEscaneados}
          seleccionados={seleccionados}
          onToggle={handleToggleSerial}
          onToggleAll={handleToggleAll}
          onRemove={handleRemoveSerial}
        />
        <PrealertaMaterial />
      </div>

      <ConfirmModal
        item={confirmItem}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleEliminar}
      />

      <Toast toast={toast} />

      <SincronizarModal
        isOpen={modalSincronizar}
        fecha={new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Bogota",
        })}
        onClose={() => setModalSincronizar(false)}
        onConfirm={(fecha, documento) => sincronizarDesdeAPI(fecha, documento)}
      />
    </div>
  );
}

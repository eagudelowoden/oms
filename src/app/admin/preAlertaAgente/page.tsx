"use client";

import React from "react";
import styles from "./prealerta.module.css";

import { usePrealerta } from "./hooks/usePrealerta";
import PrealertaHeader from "./components/PrealertaHeader";
import PrealertaTabla from "./components/PrealertaTabla";
import PrealertaAcciones from "./components/PrealertaAcciones";
import RegistroSeries from "./components/RegistroSeries";
import { PrealertaSeriales } from "./components/PrealertaGrid"; // ← solo este
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
        onEmpacar={handleEmpacar}
        empacando={empacando}
        progreso={progreso}
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      {/* Seriales — fila completa */}
      <PrealertaSeriales
        seriales={serialesEscaneados}
        seleccionados={seleccionados}
        onToggle={handleToggleSerial}
        onToggleAll={handleToggleAll}
        onRemove={handleRemoveSerial}
      />

      {/* Registro Series — fila completa */}
      <RegistroSeries />

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

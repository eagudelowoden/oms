"use client";

import React, { useState } from "react"; // ← agregar useState
import styles from "./prealerta.module.css";

import { usePrealerta } from "./hooks/usePrealerta";
import PrealertaHeader from "./components/PrealertaHeader";
import PrealertaTabla from "./components/PrealertaTabla";
import PrealertaAcciones from "./components/PrealertaAcciones";
import RegistroSeries from "./components/RegistroSeries";
import { PrealertaSeriales } from "./components/PrealertaGrid";
import { ConfirmModal, Toast } from "./components/PrealertaModals";
import ScannerModal from "../../_modulos/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/SincronizarModal";
import SincronizarAccesoriosModal from "./components/SincronizarAccesoriosModal"; // ← NUEVA

export default function PreAlertaAgentePage() {
  const [modalAccesorios, setModalAccesorios] = useState(false); // ← NUEVA

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
    sincronizandoAccesorios,
    empacarAccesoriosAgrupados, // ← NUEVA
    seleccionados,
    handleToggleSerial,
    handleToggleAll,
    modalSincronizar,
    setModalSincronizar,
    handleAgregarSerial,
    handleActualizarTipo,
    cajaActual,
    setCajaActual,
    handleDesempacar,
    cargandoSeriales,
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
        cajaActual={cajaActual}
        onCajaChange={setCajaActual}
        onDesempacar={handleDesempacar}
        onSincronizarAccesorios={() => setModalAccesorios(true)} // ← NUEVA
        sincronizandoAccesorios={sincronizandoAccesorios}
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      <PrealertaSeriales
        seriales={serialesEscaneados}
        seleccionados={seleccionados}
        onToggle={handleToggleSerial}
        onToggleAll={handleToggleAll}
        onRemove={handleRemoveSerial}
        cargandoSeriales={cargandoSeriales}
      />

      <RegistroSeries
        seleccionados={seleccionados}
        onActualizarTipo={handleActualizarTipo}
        onShowToast={showToast}
      />

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

      {/* ← NUEVA */}
      <SincronizarAccesoriosModal
        isOpen={modalAccesorios}
        onClose={() => setModalAccesorios(false)}
        sincronizando={sincronizandoAccesorios}
        onConfirm={(accesorios) => {
          empacarAccesoriosAgrupados(accesorios);
          setModalAccesorios(false);
        }}
      />
    </div>
  );
}

"use client";

import React from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/useAgente";
import PrealertaHeader from "./components/PrealertaEncabezado";
import PrealertaTabla from "./components/PrealertaTablaDetalle";
import PrealertaAcciones from "./components/PrealertaAcciones";
import { PrealertaSeriales } from "./components/PrealertaListado";
import { ConfirmModal, Toast } from "./components/PrealertaModales";
import ScannerModal from "@/modules/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/ModalSincronizarSeriales";
import SincronizarAccesoriosModal from "./components/ModalSincronizarAccesorios";
import RegistroSeries from "./components/RegistroSeries";

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
    serialesMostrados,
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
    empacarAccesoriosAgrupados,
    seleccionados,
    handleToggleSerial,
    handleToggleAll,
    modalSincronizar,
    setModalSincronizar,
    modalAccesorios,
    setModalAccesorios,
    handleAgregarSerial,
    handleActualizarTipo,
    cajaActual,
    setCajaActual,
    handleDesempacar,
    cargandoSeriales,
    cajas,
    serialesDeCaja,
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
        onSincronizarAccesorios={() => setModalAccesorios(true)}
        sincronizandoAccesorios={sincronizandoAccesorios}
        cajas={cajas}
        serialesDeCaja={serialesDeCaja}
      />

      <PrealertaSeriales
        seriales={serialesMostrados}
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

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      <SincronizarModal
        isOpen={modalSincronizar}
        fecha={new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Bogota",
        })}
        onClose={() => setModalSincronizar(false)}
        onConfirm={(fecha, documento) => sincronizarDesdeAPI(fecha, documento)}
      />

      <SincronizarAccesoriosModal
        isOpen={modalAccesorios}
        onClose={() => setModalAccesorios(false)}
        sincronizando={sincronizandoAccesorios}
        onConfirm={(accesorios) => {
          empacarAccesoriosAgrupados(accesorios);
          setModalAccesorios(false);
        }}
      />

      <ConfirmModal
        item={confirmItem}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleEliminar}
      />

      <Toast toast={toast} />
    </div>
  );
}

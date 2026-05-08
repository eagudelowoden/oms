"use client";

import React, { useState } from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/useAgente";
import PrealertaHeader from "./components/Agentecabezado";
import PrealertaTabla from "./components/TablaDetalle";
import PrealertaAcciones from "./components/AgenteAcciones";
import { PrealertaSeriales } from "./components/SerialesListado";
import { ConfirmModal, Toast } from "./components/ModalEliminar";
import ScannerModal from "@/modules/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/ModalSincronizarSeriales";
import SincronizarAccesoriosModal from "./components/ModalSincronizarAccesorios";
import RegistroSeries from "./components/RegistroAccesorios";
import RegistroManualSerial from "./components/RegistroManualSerial";

export default function AgentePage() {
  const {
    isLoading,
    query,
    setQuery,
    setSedeId,
    sortCol,
    sortAsc,
    filteredAndSorted,
    scannerOpen,
    setScannerOpen,
    serialesMostrados,
    handleRemoveSerial,
    handleRemoveSeleccionados,
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
    serialesPrevista,
    limpiarPrevista,
    guardandoSeriales,
    handleGuardarSeriales,
    handleAgregarSerial,
    handleActualizarTipo,
    cajaActual,
    setCajaActual,
    handleDesempacar,
    cargandoSeriales,
    cajas,
    serialesDeCaja,
  } = usePrealerta();

  const fechaHoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });

  const [mostrarRegistroManual, setMostrarRegistroManual] = useState(true);

  return (
    <div className={styles.wrapper}>
      <PrealertaHeader
        onCrear={handleCrearPrealerta}
        onSedeChange={setSedeId}
      />

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
        onRemoveSeleccionados={handleRemoveSeleccionados}
        cargandoSeriales={cargandoSeriales}
      />

      {mostrarRegistroManual && (
        <RegistroManualSerial
          onAgregarSerial={handleAgregarSerial}
          onShowToast={showToast}
          onClose={() => setMostrarRegistroManual(false)}
        />
      )}
      {!mostrarRegistroManual && (
        <button
          type="button"
          onClick={() => setMostrarRegistroManual(true)}
          style={{
            alignSelf: "flex-start",
            height: 30,
            padding: "0 14px",
            background: "transparent",
            border: "0.5px solid #e2e8f0",
            borderRadius: 6,
            fontSize: 11,
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          + Registro Manual
        </button>
      )}

      <RegistroSeries
        onAgregarAccesorio={handleAgregarSerial}
        onShowToast={showToast}
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      <SincronizarModal
        isOpen={modalSincronizar}
        fecha={fechaHoy}
        sincronizando={sincronizando}
        serialesPrevista={serialesPrevista}
        guardando={guardandoSeriales}
        onClose={() => {
          setModalSincronizar(false);
          limpiarPrevista();
        }}
        onSincronizar={(fecha, documento) =>
          sincronizarDesdeAPI(fecha, documento)
        }
        onGuardar={handleGuardarSeriales}
        onVolver={limpiarPrevista}
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

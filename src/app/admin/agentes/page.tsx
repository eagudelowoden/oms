"use client";

import React, { useState } from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/useAgente";
import PrealertaHeader from "./components/Agentecabezado";
import PrealertaTabla from "./components/TablaDetalle";
import PrealertaAcciones from "./components/AgenteAcciones";
import { PrealertaSeriales } from "./components/SerialesListado";
import { ConfirmModal, Toast } from "./components/ModalEliminar";
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
    handleEmpacar,
    showToast,
    empacando,
    progreso,
    sincronizando,
    sincronizarDesdeAPI,
    handleSincronizarCodigoSap,
    sincronizandoSap,
    modalEnriquecerSap,
    setModalEnriquecerSap,
    handleEnriquecerSap,
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
    handleRefresh,
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
        onCargaManual={() => setMostrarRegistroManual((v) => !v)}
        mostrarRegistroManual={mostrarRegistroManual}
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
        onRefresh={handleRefresh}
      />

      <PrealertaSeriales
        seriales={serialesMostrados}
        seleccionados={seleccionados}
        onToggle={handleToggleSerial}
        onToggleAll={handleToggleAll}
        onRemove={handleRemoveSerial}
        onRemoveSeleccionados={handleRemoveSeleccionados}
        cargandoSeriales={cargandoSeriales}
        onSincronizarSap={preAlertaSeleccionada ? handleSincronizarCodigoSap : undefined}
        sincronizandoSap={sincronizandoSap}
      />

      {mostrarRegistroManual && (
        <RegistroManualSerial
          onAgregarSerial={handleAgregarSerial}
          onShowToast={showToast}
          onClose={() => setMostrarRegistroManual(false)}
        />
      )}

      <RegistroSeries
        onAgregarAccesorio={handleAgregarSerial}
        onShowToast={showToast}
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

      {/* Modal enriquecer seriales con código SAP vía API CRM */}
      <SincronizarModal
        isOpen={modalEnriquecerSap}
        fecha={fechaHoy}
        sincronizando={sincronizandoSap}
        serialesPrevista={[]}
        guardando={false}
        onClose={() => setModalEnriquecerSap(false)}
        onSincronizar={(fecha, documento) => handleEnriquecerSap(fecha, documento)}
        onGuardar={() => {}}
        onVolver={() => {}}
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

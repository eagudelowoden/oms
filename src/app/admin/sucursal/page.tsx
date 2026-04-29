"use client";

import React from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/useAgente";
import PrealertaHeader from "./components/Sucursalcabezado";
import PrealertaTabla from "./components/TablaDetalle";
import PrealertaAcciones from "./components/SucursalAcciones";
import { PrealertaSeriales } from "./components/SerialesListado";
import { ConfirmModal, Toast } from "./components/ModalEliminar";
import ScannerModal from "@/modules/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/ModalSincronizarSeriales";
import SincronizarAccesoriosModal from "./components/ModalSincronizarAccesorios";
import RegistroSeries from "./components/RegistroAccesorios";
import CargarArchivo from "./components/CargarArchivo";

export default function AgentePage() {
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
    handleAgregarSerial,
    handleActualizarTipo,
    cajaActual,
    setCajaActual,
    handleDesempacar,
    cargandoSeriales,
    cajas,
    serialesDeCaja,
    handleCargarSeriales,
  } = usePrealerta();

  return (
    <div className={styles.wrapper}>
      <PrealertaHeader onCrear={handleCrearPrealerta} />

      <CargarArchivo
        preAlertaSeleccionada={preAlertaSeleccionada}
        onShowToast={showToast}
        onCargarSeriales={handleCargarSeriales}
        onCrearPrealerta={handleCrearPrealerta}
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

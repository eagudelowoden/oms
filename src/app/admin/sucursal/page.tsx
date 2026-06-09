"use client";

import React from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/useAgente";
import PrealertaHeader from "./components/Sucursalcabezado";
import PrealertaTabla from "./components/TablaDetalle";
import { PrealertaSeriales } from "./components/SerialesListado";
import { ConfirmModal, Toast } from "./components/ModalEliminar";
import CargarArchivo from "./components/CargarArchivo";

export default function AgentePage() {
  const {
    isLoading,
    query,
    setQuery,
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
    showToast,
    seleccionados,
    handleToggleSerial,
    handleToggleAll,
    cargandoSeriales,
    handleCargarSeriales,
    handleEmpacarDesdeArchivo,
    handleCrearYEmpacarDesdeArchivo,
  } = usePrealerta();

  return (
    <div className={styles.wrapper}>
      <PrealertaHeader />

      <CargarArchivo
        preAlertaSeleccionada={preAlertaSeleccionada}
        onShowToast={showToast}
        onCargarSeriales={handleCargarSeriales}
        onEmpacarDesdeArchivo={handleEmpacarDesdeArchivo}
        onCrearYEmpacarDesdeArchivo={handleCrearYEmpacarDesdeArchivo}
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
        onDeseleccionar={() => setPreAlertaSeleccionada(null)}
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

      <ConfirmModal
        item={confirmItem}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleEliminar}
      />

      <Toast toast={toast} />
    </div>
  );
}

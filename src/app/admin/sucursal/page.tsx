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
  } = usePrealerta();

  return (
    <div className={styles.wrapper}>
      <PrealertaHeader
        onCrear={async (sedeId, sedeNombre) => {
          try {
            await handleCrearPrealerta(sedeId, sedeNombre);
            showToast("✓ Prealerta creada");
          } catch {
            showToast("Error al crear la prealerta", "error");
          }
        }}
      />

      <CargarArchivo
        preAlertaSeleccionada={preAlertaSeleccionada}
        onShowToast={showToast}
        onCargarSeriales={handleCargarSeriales}
        onEmpacarDesdeArchivo={handleEmpacarDesdeArchivo}
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
        onCancel={() => setPreAlertaSeleccionada(null)}
        onConfirm={handleEliminar}
      />

      <Toast toast={toast} />
    </div>
  );
}

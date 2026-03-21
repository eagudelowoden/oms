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
      />

      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onConfirm={handleSerialConfirm}
      />

      <div className={styles.bottomGrid}>
        <PrealertaSeriales
          seriales={serialesEscaneados}
          onRemove={handleRemoveSerial}
        />
        <PrealertaMaterial />
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.btnEmpacar}
          onClick={handleEmpacar}
        >
          Empacar
        </button>
        <button type="button" className={styles.btnDesempacar}>
          Desempacar
        </button>
      </div>

      <ConfirmModal
        item={confirmItem}
        onCancel={() => setConfirmItem(null)}
        onConfirm={handleEliminar}
      />

      <Toast toast={toast} />
    </div>
  );
}

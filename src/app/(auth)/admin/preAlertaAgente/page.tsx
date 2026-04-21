"use client";

import React, { useState, useEffect } from "react";
import styles from "./css/prealerta.module.css";
import { usePrealerta } from "./hooks/usePrealerta";
import PrealertaHeader from "./components/PrealertaEncabezado";
import PrealertaTabla from "./components/PrealertaTablaDetalle";

import PrealertaAcciones, {
  CajaItem,
  SerialEmpacado,
} from "./components/PrealertaAcciones";
import RegistroSeries from "./components/RegistroSeries";
import { PrealertaSeriales } from "./components/PrealertaListado";
import { ConfirmModal, Toast } from "./components/PrealertaModales";
import ScannerModal from "@/modules/auth/components/scanner/scannerModal";
import SincronizarModal from "./components/ModalSincronizar";
import SincronizarAccesoriosModal from "./components/ModalSincronizarAccesorios";

export default function PreAlertaAgentePage() {
  const [modalAccesorios, setModalAccesorios] = useState(false);
  const [cajas, setCajas] = useState<CajaItem[]>([]);
  const [serialesDeCaja, setSerialesdeCaja] = useState<SerialEmpacado[]>([]);

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
    empacarAccesoriosAgrupados,
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

  // ── Carga cajas cuando cambia la prealerta seleccionada ──
  useEffect(() => {
    let cancelled = false;

    const fetchCajas = async () => {
      if (!preAlertaSeleccionada?.id) {
        if (!cancelled) {
          setCajas([]);
          setCajaActual(1);
          setSerialesdeCaja([]);
        }
        return;
      }

      try {
        const res = await fetch(
          `/api/prealerta/cajas?prealertaId=${preAlertaSeleccionada.id}`,
        );
        if (res.ok && !cancelled) {
          const data: { cajas: CajaItem[] } = await res.json();
          setCajas(data.cajas);
          setCajaActual((data.cajas.at(-1)?.numero ?? 0) + 1);
          setSerialesdeCaja([]);
        }
      } catch {
        if (!cancelled) {
          setCajas([]);
          setCajaActual(1);
        }
      }
    };

    fetchCajas();

    return () => {
      cancelled = true;
    };
  }, [preAlertaSeleccionada?.id]);

  // ── Carga seriales cuando se selecciona una caja existente ──
  useEffect(() => {
    if (!preAlertaSeleccionada?.id) return;

    const esCajaExistente = cajas.some((c) => c.numero === cajaActual);

    let cancelled = false;

    const fetchSeriales = async () => {
      if (!esCajaExistente) {
        setSerialesdeCaja([]);
        return;
      }

      try {
        const res = await fetch(
          `/api/prealerta/serialesPorCaja?prealertaId=${preAlertaSeleccionada.id}&caja=${cajaActual}`,
        );
        if (res.ok && !cancelled) {
          const data: SerialEmpacado[] = await res.json();
          setSerialesdeCaja(data);
        }
      } catch {
        if (!cancelled) setSerialesdeCaja([]);
      }
    };

    fetchSeriales();

    return () => {
      cancelled = true;
    };
  }, [cajaActual, preAlertaSeleccionada?.id]);

  // ── Refresca cajas tras empacar ──
  const refreshCajas = async () => {
    if (!preAlertaSeleccionada?.id) return;
    try {
      const res = await fetch(
        `/api/prealerta/cajas?prealertaId=${preAlertaSeleccionada.id}`,
      );
      if (res.ok) {
        const data: { cajas: CajaItem[] } = await res.json();
        setCajas(data.cajas);
      }
    } catch {}
  };

  const handleEmpacarConRefresh = async () => {
    await handleEmpacar();
    await refreshCajas();
  };

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
        onEmpacar={handleEmpacarConRefresh}
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

"use client";

import React, { useRef, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import styles from "../css/prealerta.module.css";
import { SerialItem } from "@/app/models/seriales.models";

interface Sede {
  id: number;
  nombre: string;
}

interface Props {
  preAlertaSeleccionada: { id?: number; nombre: string } | null;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
  onCargarSeriales: (seriales: SerialItem[]) => void;
  onEmpacarDesdeArchivo: (
    seriales: SerialItem[],
    caja: number,
  ) => Promise<{ exitosos: number; yaExistian: number; fallidos: number; enOtraPrealerta: number }>;
  onCrearYEmpacarDesdeArchivo: (
    sedeId: number,
    sedeNombre: string,
    nombre: string,
    seriales: SerialItem[],
  ) => Promise<void>;
}

const ICON_EXCEL = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/** Lee una columna de forma case-insensitive — soporta cualquier variante del nombre */
function col(row: Record<string, unknown>, ...names: string[]): string {
  for (const name of names) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === name.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    if (key != null && row[key] != null) return String(row[key]).trim();
  }
  return "";
}

/** Convierte las filas del archivo (nuevo formato) en SerialItem[] */
function parsearFilas(rows: Record<string, unknown>[]): SerialItem[] {
  const items: SerialItem[] = [];

  for (const row of rows) {
    const serial     = col(row, "serial");
    const mac        = col(row, "mac");
    const codigoSap  = col(row, "codigosap", "codigo_sap", "CodigoSap");
    const descripcion = col(row, "descripcion", "Descripcion");
    const cajaVal    = parseInt(col(row, "caja", "Caja") || "1") || 1;
    const cantidad   = parseInt(col(row, "cantidad", "Cantidad") || "1") || 1;
    const tramite    = col(row, "tramite", "Tramite") || "Archivo";
    const tipoRaw    = col(row, "tipo", "Tipo");

    const tipo: "Serializable" | "No-serializable" =
      tipoRaw.toLowerCase().includes("no") ? "No-serializable" : "Serializable";

    // Serializable sin serial → saltar
    if (tipo === "Serializable" && !serial) continue;

    items.push({
      codigo: serial || codigoSap,
      origen: "api",
      tipo,
      cantidad: tipo === "No-serializable" ? cantidad : 1,
      mac: mac || undefined,
      codigo_sap: codigoSap || undefined,
      descripcion: descripcion || undefined,
      tramite,
      caja: cajaVal,
    });
  }

  return items;
}

export default function CargarArchivo({
  preAlertaSeleccionada,
  onShowToast,
  onCargarSeriales,
  onEmpacarDesdeArchivo,
  onCrearYEmpacarDesdeArchivo,
}: Props) {
  const inputCrear    = useRef<HTMLInputElement>(null);
  const inputSeriales = useRef<HTMLInputElement>(null);

  const [sedes, setSedes]               = useState<Sede[]>([]);
  const [sedeSeleccionada, setSedeSeleccionada] = useState<Sede | null>(null);
  const [cargandoCrear, setCargandoCrear]       = useState(false);
  const [cargandoSeriales, setCargandoSeriales] = useState(false);

  useEffect(() => {
    fetch("/api/agente/sedes")
      .then((r) => r.json())
      .then((data: Sede[]) => {
        setSedes(data);
        if (data.length > 0) setSedeSeleccionada(data[0]);
      })
      .catch(() => {});
  }, []);

  /* ── CARGAR ARCHIVO: crea prealerta + asocia seriales ── */
  const parsearArchivoCompleto = async (file: File) => {
    if (!sedeSeleccionada) {
      onShowToast("Selecciona una sede primero", "error");
      return;
    }
    setCargandoCrear(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rows.length === 0) {
        onShowToast("El archivo no tiene filas de datos", "error");
        return;
      }

      const items = parsearFilas(rows);
      if (items.length === 0) {
        onShowToast("No se encontraron seriales válidos en el archivo", "error");
        return;
      }

      // Nombre de la prealerta = nombre del archivo sin extensión
      const nombre = file.name.replace(/\.[^/.]+$/, "").slice(0, 40);

      await onCrearYEmpacarDesdeArchivo(
        sedeSeleccionada.id,
        sedeSeleccionada.nombre,
        nombre,
        items,
      );

      onShowToast(`✓ Prealerta "${nombre}" creada con ${items.length} serial${items.length !== 1 ? "es" : ""}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      onShowToast(msg, "error");
    } finally {
      setCargandoCrear(false);
      if (inputCrear.current) inputCrear.current.value = "";
    }
  };

  /* ── CARGAR EN PREALERTA SELECCIONADA: solo asocia seriales ── */
  const parsearSerialesEnPrealerta = async (file: File) => {
    if (!preAlertaSeleccionada) {
      onShowToast("Selecciona una prealerta primero", "error");
      return;
    }
    setCargandoSeriales(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      if (rows.length === 0) {
        onShowToast("El archivo no tiene filas de datos", "error");
        return;
      }

      const items = parsearFilas(rows);
      if (items.length === 0) {
        onShowToast("No se encontraron seriales válidos", "error");
        return;
      }

      // Agrupar por caja y empacar
      const porCaja = new Map<number, SerialItem[]>();
      for (const item of items) {
        const caja = item.caja ?? 1;
        const grupo = porCaja.get(caja) ?? [];
        grupo.push(item);
        porCaja.set(caja, grupo);
      }

      let totalExitosos = 0, totalYaExistian = 0, totalFallidos = 0, totalEnOtra = 0;

      for (const [caja, seriales] of porCaja) {
        try {
          const r = await onEmpacarDesdeArchivo(seriales, caja);
          totalExitosos    += r.exitosos;
          totalYaExistian  += r.yaExistian;
          totalFallidos    += r.fallidos;
          totalEnOtra      += r.enOtraPrealerta ?? 0;
        } catch {
          totalFallidos += seriales.length;
        }
      }

      if (totalExitosos > 0)
        onShowToast(`✓ ${totalExitosos} serial${totalExitosos !== 1 ? "es" : ""} cargado${totalExitosos !== 1 ? "s" : ""} en ${porCaja.size} caja${porCaja.size !== 1 ? "s" : ""}`);
      if (totalYaExistian > 0)
        onShowToast(`⚠ ${totalYaExistian} ya estaban empacados`, "error");
      if (totalEnOtra > 0)
        onShowToast(`✗ ${totalEnOtra} serial${totalEnOtra !== 1 ? "es" : ""} ya existe${totalEnOtra !== 1 ? "n" : ""} en otra prealerta`, "error");
      if (totalFallidos > 0)
        onShowToast(`✗ ${totalFallidos} no se pudieron cargar`, "error");
    } catch {
      onShowToast("Error al leer el archivo", "error");
    } finally {
      setCargandoSeriales(false);
      if (inputSeriales.current) inputSeriales.current.value = "";
    }
  };

  return (
    <div className={styles.card} style={{ padding: "10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

        {/* ── Selector de sede (para crear prealerta) ── */}
        <select
          style={{
            height: 30,
            padding: "0 8px",
            fontSize: 11,
            border: "0.5px solid #e2e8f0",
            borderRadius: 6,
            background: "#fff",
            color: "#1e293b",
            outline: "none",
            cursor: "pointer",
          }}
          value={sedeSeleccionada?.id ?? ""}
          onChange={(e) => {
            const sede = sedes.find((s) => s.id === Number(e.target.value));
            setSedeSeleccionada(sede ?? null);
          }}
        >
          {sedes.length === 0 && <option value="">Cargando sedes...</option>}
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        {/* ── Cargar Archivo: crea prealerta + asocia seriales ── */}
        <input
          ref={inputCrear}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parsearArchivoCompleto(file);
          }}
        />
        <button
          type="button"
          className={styles.btnExcel}
          onClick={() => inputCrear.current?.click()}
          disabled={cargandoCrear || !sedeSeleccionada}
          title="Crea una prealerta y carga los seriales del archivo"
        >
          {cargandoCrear ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : ICON_EXCEL}
          {cargandoCrear ? "Creando…" : "Cargar Archivo"}
        </button>

        {/* ── Cargar en prealerta seleccionada ── */}
        <input
          ref={inputSeriales}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parsearSerialesEnPrealerta(file);
          }}
        />
        <button
          type="button"
          className={styles.btnExcel}
          onClick={() => {
            if (!preAlertaSeleccionada) {
              onShowToast("Selecciona una prealerta primero", "error");
              return;
            }
            inputSeriales.current?.click();
          }}
          disabled={cargandoSeriales}
          title="Carga los seriales del archivo en la prealerta seleccionada"
        >
          {cargandoSeriales ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : ICON_EXCEL}
          {cargandoSeriales ? "Cargando…" : "Cargar en prealerta seleccionada"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

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
  onCrearPrealerta: (sedeId: number, sedeNombre: string, nombre: string) => Promise<void>;
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

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

function descargarPlantilla(tipo: "prealerta" | "seriales") {
  const wb = XLSX.utils.book_new();

  if (tipo === "prealerta") {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre", "Ciudad"],
      ["Prealerta Ejemplo", "Bogotá"],
    ]);
    ws["!cols"] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Prealerta");
    XLSX.writeFile(wb, "plantilla_prealerta.xlsx");
  } else {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Serial", "Tipo", "Cantidad", "Mac", "CodigoSap", "Descripcion"],
      ["ABC123456", "Serializable", "1", "", "", ""],
      ["", "No-serializable", "5", "", "T0005", "Fuente 12V 2A"],
    ]);
    ws["!cols"] = [
      { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Seriales");
    XLSX.writeFile(wb, "plantilla_seriales.xlsx");
  }
}

export default function CargarArchivo({
  preAlertaSeleccionada,
  onShowToast,
  onCargarSeriales,
  onCrearPrealerta,
}: Props) {
  const inputPrealerta = useRef<HTMLInputElement>(null);
  const inputSeriales = useRef<HTMLInputElement>(null);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [cargandoPrealerta, setCargandoPrealerta] = useState(false);
  const [cargandoSeriales, setCargandoSeriales] = useState(false);

  useEffect(() => {
    fetch("/api/agente/sedes")
      .then((r) => r.json())
      .then(setSedes)
      .catch(() => {});
  }, []);

  const parsearPrealerta = async (file: File) => {
    setCargandoPrealerta(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<{ Nombre?: string; Ciudad?: string }>(ws);

      if (rows.length === 0) {
        onShowToast("El archivo no tiene filas de datos", "error");
        return;
      }

      let creadas = 0;
      const errorDetalle: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nombre = row["Nombre"]?.toString().trim();
        const ciudad = row["Ciudad"]?.toString().trim();

        if (!nombre) {
          errorDetalle.push(`Fila ${i + 2}: falta el campo Nombre`);
          continue;
        }
        if (!ciudad) {
          errorDetalle.push(`Fila ${i + 2}: falta el campo Ciudad`);
          continue;
        }

        const sedeEncontrada = sedes.find(
          (s) => normalizar(s.nombre) === normalizar(ciudad),
        );

        if (!sedeEncontrada) {
          const disponibles = sedes.map((s) => s.nombre).join(", ");
          errorDetalle.push(
            `Fila ${i + 2}: ciudad "${ciudad}" no encontrada. Disponibles: ${disponibles}`,
          );
          continue;
        }

        const nombreTruncado = nombre.slice(0, 50);

        try {
          await onCrearPrealerta(sedeEncontrada.id, sedeEncontrada.nombre, nombreTruncado);
          creadas++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          errorDetalle.push(`Fila ${i + 2}: ${msg}`);
        }
      }

      if (creadas > 0) {
        onShowToast(`✓ ${creadas} prealerta${creadas !== 1 ? "s" : ""} creada${creadas !== 1 ? "s" : ""}`);
      }
      for (const detalle of errorDetalle) {
        onShowToast(detalle, "error");
      }
    } catch {
      onShowToast("Error al leer el archivo", "error");
    } finally {
      setCargandoPrealerta(false);
      if (inputPrealerta.current) inputPrealerta.current.value = "";
    }
  };

  const parsearSeriales = async (file: File) => {
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

      const seriales: SerialItem[] = rows.reduce<SerialItem[]>((acc, row) => {
          const serial = row["Serial"]?.toString().trim() ?? "";
          const tipo = row["Tipo"]?.toString().trim();
          const cantidad = Number(row["Cantidad"] ?? 1);
          const mac = row["Mac"]?.toString().trim() ?? "";
          const codigoSap = row["CodigoSap"]?.toString().trim() ?? "";
          const descripcion = row["Descripcion"]?.toString().trim() ?? "";

          const tipoNorm: "Serializable" | "No-serializable" =
            tipo?.toLowerCase().includes("no") ? "No-serializable" : "Serializable";

          if (tipoNorm === "Serializable" && !serial) return acc;

          acc.push({
            codigo: serial || codigoSap,
            origen: "api",
            tipo: tipoNorm,
            cantidad: tipoNorm === "No-serializable" ? (cantidad || 1) : 1,
            mac: mac || undefined,
            codigo_sap: codigoSap || undefined,
            descripcion: descripcion || undefined,
            tramite: "Archivo",
          });
          return acc;
        }, []);

      if (seriales.length === 0) {
        onShowToast("No se encontraron seriales válidos", "error");
        return;
      }

      onCargarSeriales(seriales);
      onShowToast(`✓ ${seriales.length} serial${seriales.length !== 1 ? "es" : ""} cargado${seriales.length !== 1 ? "s" : ""}`);
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
        {/* ── Cargar Archivo (crear prealerta) ── */}
        <input
          ref={inputPrealerta}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parsearPrealerta(file);
          }}
        />
        <button
          type="button"
          className={styles.btnExcel}
          onClick={() => inputPrealerta.current?.click()}
          disabled={cargandoPrealerta}
          title="Crea una o varias prealertas desde un archivo Excel"
        >
          {cargandoPrealerta ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : ICON_EXCEL}
          {cargandoPrealerta ? "Cargando…" : "Cargar Archivo"}
        </button>

        {/* ── Cargar en prealerta seleccionada ── */}
        <input
          ref={inputSeriales}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parsearSeriales(file);
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
          title="Carga seriales desde Excel a la prealerta seleccionada"
        >
          {cargandoSeriales ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : ICON_EXCEL}
          {cargandoSeriales ? "Cargando…" : "Cargar en prealerta seleccionada"}
        </button>

        {/* ── Separador ── */}
        <div style={{ borderLeft: "1px solid #e2e8f0", height: 20, margin: "0 2px" }} />

        {/* ── Descargar plantillas ── */}
        <button
          type="button"
          className={styles.btnPlantilla}
          onClick={() => descargarPlantilla("prealerta")}
          title="Descarga la plantilla Excel para crear prealertas"
        >
          Plantilla prealerta
        </button>
        <button
          type="button"
          className={styles.btnPlantilla}
          onClick={() => descargarPlantilla("seriales")}
          title="Descarga la plantilla Excel para cargar seriales"
        >
          Plantilla seriales
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

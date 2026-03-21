"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./prealerta.module.css";
import ScannerModal from "../../_modulos/auth/components/scanner/scannerModal";

interface PrealertaItem {
  nombre: string;
  fecha?: string;
  estado?: string;
}

export default function PreAlertaAgentePage() {
  const [prealertas, setPrealertas] = useState<PrealertaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [sortCol, setSortCol] = useState<"nombre" | "fecha" | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [serialesEscaneados, setSerialEnscaneados] = useState<string[]>([]);


  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch("/api/prealerta/list");
        if (!response.ok) throw new Error("Error al obtener datos");
        const data = await response.json();
        const dataFormateada: PrealertaItem[] = data.map(
          (item: string | PrealertaItem) =>
            typeof item === "string" ? { nombre: item } : item,
        );
        setPrealertas(dataFormateada);
      } catch (error) {
        console.error("Fallo al cargar historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarHistorial();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = prealertas.filter((r) =>
      r.nombre.toLowerCase().includes(query.toLowerCase()),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = (a[sortCol] ?? "").toLowerCase();
        const bv = (b[sortCol] ?? "").toLowerCase();
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  }, [prealertas, query, sortCol, sortAsc]);

  const handleSort = (col: "nombre" | "fecha") => {
    if (sortCol === col) setSortAsc((p) => !p);
    else { setSortCol(col); setSortAsc(true); }
  };

  const handleCrearPrealerta = async () => {
    const nombreNuevo = prompt("Ingrese el nombre de la prealerta:");
    if (!nombreNuevo?.trim()) return;
    try {
      const res = await fetch("/api/prealerta/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreNuevo.trim(),
          tipoOrigenId: 1,
          origenId: 100,
          guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
          usuarioId: 5321,
          idResponsable: 5321,
          estado: "Pendiente",
        }),
      });
      if (res.ok) {
        setPrealertas((prev) => [
          {
            nombre: nombreNuevo.trim(),
            fecha: new Date().toLocaleDateString("es-CO"),
            estado: "Pendiente",
          },
          ...prev,
        ]);
      }
    } catch (error) {
      console.error("Error al insertar:", error);
    }
  };
  const handleSerialConfirm = (seriales: string[]) => {
  console.log("Seriales confirmados:", seriales);
  // Aquí puedes: guardar en estado, enviar a API, agregar a la tabla, etc.
  setSerialEnscaneados((prev) => [...prev, ...seriales]);
};

  const handleEliminar = (nombre: string) => {
    setPrealertas((prev) => prev.filter((r) => r.nombre !== nombre));
  };

  const sortIcon = (col: "nombre" | "fecha") => {
    if (sortCol !== col) return <span className={styles.sortIcon}>↕</span>;
    return <span className={`${styles.sortIcon} ${styles.sortActive}`}>{sortAsc ? "↑" : "↓"}</span>;
  };

  return (
    <div className={styles.wrapper}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>Historial Pre-Alerta Agente</h2>
        <button type="button" className={styles.btnNew} onClick={handleCrearPrealerta}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7" cy="7" r="5.5"/><line x1="7" y1="4.2" x2="7" y2="9.8"/><line x1="4.2" y1="7" x2="9.8" y2="7"/>
          </svg>
          Crear prealerta
        </button>
      </div>

      {/* ── TABLA ── */}
      <div className={styles.card}>
        <div className={styles.searchBar}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <circle cx="5" cy="5" r="3.2"/><line x1="7.6" y1="7.6" x2="10.5" y2="10.5"/>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className={styles.clearBtn} onClick={() => setQuery("")}>✕</button>
          )}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort("nombre")} className={styles.thSortable}>
                  NOMBRE {sortIcon("nombre")}
                </th>
                <th onClick={() => handleSort("fecha")} className={styles.thSortable}>
                  FECHA {sortIcon("fecha")}
                </th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className={styles.emptyCell}>Cargando...</td></tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr><td colSpan={4} className={styles.emptyCell}>Sin resultados</td></tr>
              ) : (
                filteredAndSorted.map((item, i) => (
                  <tr key={i}>
                    <td>{item.nombre}</td>
                    <td className={styles.tdMuted}>{item.fecha ?? new Date().toLocaleDateString("es-CO")}</td>
                    <td className={styles.tdMuted}>{item.estado ?? "Pendiente"}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.btnDel}
                        onClick={() => handleEliminar(item.nombre)}
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                          <polyline points="2.5,4 11.5,4"/>
                          <path d="M5 4V3h4v1"/>
                          <path d="M4 4l.6 7.5h4.8L10 4"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARGA + FECHA ── */}
  {/* ── CARGA + FECHA ── */}
<div className={styles.midRow}>
  <div className={styles.uploadGroup}>
    <button type="button" className={styles.btnUpload}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 10V4M5 7l3-3 3 3"/><path d="M2 12.5h12"/>
      </svg>
      Cargar Recuperaciones Día
    </button>
    <button type="button" className={styles.btnManual} onClick={() => setScannerOpen(true)}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="5" height="5" rx="1"/>
        <rect x="10" y="1" width="5" height="5" rx="1"/>
        <rect x="1" y="10" width="5" height="5" rx="1"/>
        <path d="M10 10h2v2h-2zM12 12h3M12 10h3M10 12v3"/>
      </svg>
      Carga manual
    </button>
  </div>
  <div className={styles.fechaCard}>
    <label htmlFor="fechaProceso" className={styles.fechaLabel}>Fecha Proceso</label>
    <input id="fechaProceso" type="date" className={styles.fechaInput} />
  </div>
</div>

<ScannerModal
  isOpen={scannerOpen}
  onClose={() => setScannerOpen(false)}
  onConfirm={handleSerialConfirm}
/>
      {/* ── BOTTOM GRID ── */}
      <div className={styles.bottomGrid}>

        {/* Equipos recuperados */}
        <div className={styles.card}>
          <div className={styles.checkList}>
            {[1, 2, 3, 4].map((i) => (
              <label key={i} className={styles.checkItem}>
                <input type="checkbox" />
                <span>Equipo Recuperado ID: {i}982</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tipo material */}
        <div className={styles.card}>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Tipo Material</th>
                <th>Caja Asignada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Equipos</td>
                <td><input type="text" placeholder="Ej: J-12" className={styles.miniInput} /></td>
              </tr>
              <tr>
                <td>Accesorios</td>
                <td><input type="text" placeholder="Ej: J-13" className={styles.miniInput} /></td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div className={styles.footer}>
        <button type="button" className={styles.btnEmpacar}>Empacar</button>
        <button type="button" className={styles.btnDesempacar}>Desempacar</button>
      </div>

    </div>
  );
}

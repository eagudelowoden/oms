import React, { useState } from "react";
import styles from "../css/prealerta.module.css";
import { PrealertaItem } from "@/app/models/Prealerta.models";

interface Props {
  isLoading: boolean;
  items: PrealertaItem[];
  query: string;
  setQuery: (v: string) => void;
  sortCol: "nombre" | "fecha" | null;
  sortAsc: boolean;
  onSort: (col: "nombre" | "fecha") => void;
  seleccionada: PrealertaItem | null;
  onSeleccionar: (item: PrealertaItem) => void;
  onEliminar: (item: PrealertaItem) => void;
}

function SortIcon({
  col,
  sortCol,
  sortAsc,
}: {
  col: string;
  sortCol: string | null;
  sortAsc: boolean;
}) {
  if (sortCol !== col) return <span className={styles.sortIcon}>↕</span>;
  return (
    <span className={`${styles.sortIcon} ${styles.sortActive}`}>
      {sortAsc ? "↑" : "↓"}
    </span>
  );
}

export default function PrealertaTabla({
  isLoading,
  items,
  query,
  setQuery,
  sortCol,
  sortAsc,
  onSort,
  seleccionada,
  onSeleccionar,
  onEliminar,
}: Props) {
  const [ciudadFiltro, setCiudadFiltro] = useState("");

  const ciudades = [...new Set(
    items.map((i) => i.ciudad ?? "").filter(Boolean)
  )].sort();

  const visibles = ciudadFiltro
    ? items.filter((i) => i.ciudad === ciudadFiltro)
    : items;

  return (
    <div className={styles.card}>
      {/* Búsqueda + filtro ciudad */}
      <div className={styles.searchBar}>
        <div className={styles.cityFilterWrap}>
          <span className={`material-symbols-rounded ${styles.cityFilterIcon}`}>location_on</span>
          <select
            className={styles.cityFilterSelect}
            value={ciudadFiltro}
            onChange={(e) => setCiudadFiltro(e.target.value)}
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <svg className={styles.cityFilterChevron} width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ color: "var(--c-hint)", flexShrink: 0 }}>
          <circle cx="5" cy="5" r="3.2" />
          <line x1="7.6" y1="7.6" x2="10.5" y2="10.5" />
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

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th
                onClick={() => onSort("nombre")}
                className={styles.thSortable}
              >
                NOMBRE{" "}
                <SortIcon col="nombre" sortCol={sortCol} sortAsc={sortAsc} />
              </th>
              <th onClick={() => onSort("fecha")} className={styles.thSortable}>
                FECHA{" "}
                <SortIcon col="fecha" sortCol={sortCol} sortAsc={sortAsc} />
              </th>
              <th>Creado Por</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Cargando...
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  Sin resultados
                </td>
              </tr>
            ) : (
              visibles.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className={
                    seleccionada?.nombre === item.nombre
                      ? styles.trSelected
                      : ""
                  }
                  onClick={() => onSeleccionar(item)}
                  style={{ cursor: "pointer" }}
                >
                  <td className={styles.tdMuted}>{item.id ?? "—"}</td>
                  <td>{item.nombre}</td>
                  <td className={styles.tdMuted}>
                    {item.fecha ?? new Date().toLocaleDateString("es-CO")}
                  </td>
                  <td>{item.usuarioNombre}</td>
                  {/* Estado */}
                  <td>
                    <span
                      className={
                        item.estado === "Empacado"
                          ? styles.estadoPill
                          : styles.estadoPillPendiente
                      }
                    >
                      {item.estado ?? "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.btnDel}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminar(item);
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      >
                        <polyline points="2.5,4 11.5,4" />
                        <path d="M5 4V3h4v1" />
                        <path d="M4 4l.6 7.5h4.8L10 4" />
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
  );
}

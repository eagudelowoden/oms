"use client";

import React, { useState } from "react";
import styles from "../css/recoleccion.module.css";
import { PrealertaSucursalRow } from "@/app/services/recoleccion-sucursal.service";

interface Props {
  prealertas: PrealertaSucursalRow[];
  isLoading: boolean;
  seleccionada: PrealertaSucursalRow | null;
  onSeleccionar: (p: PrealertaSucursalRow) => void;
  onRefresh: () => void;
}

export default function TablaPrealertas({
  prealertas,
  isLoading,
  seleccionada,
  onSeleccionar,
  onRefresh,
}: Props) {
  const [ciudadFiltro, setCiudadFiltro] = useState("");

  const ciudades = [...new Set(prealertas.map((p) => p.ciudad ?? "").filter(Boolean))].sort();
  const filtered = ciudadFiltro
    ? prealertas.filter((p) => p.ciudad === ciudadFiltro)
    : prealertas;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Prealertas</span>
          <span className={styles.countPill}>{filtered.length}</span>
        </div>
        <button
          className={styles.btnRefresh}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refrescar"
        >
          <span className={`material-symbols-rounded ${isLoading ? styles.spinning : ""}`}>
            refresh
          </span>
        </button>
      </div>

      {/* ── City filter ── */}
      <div style={{ padding: "6px 12px", borderBottom: "0.5px solid var(--c-border)", background: "var(--c-bg)", display: "flex", alignItems: "center" }}>
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
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Id</th>
              <th>Nombre</th>
              <th>Ciudad</th>
              <th>Fecha</th>
              <th>Creado por</th>
              <th>Estado</th>
              <th>Programado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className={styles.emptyCell}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyCell}>No hay prealertas programadas</td></tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className={seleccionada?.id === p.id ? styles.trSelected : ""}
                  onClick={() => onSeleccionar(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <input
                      type="radio"
                      checked={seleccionada?.id === p.id}
                      onChange={() => onSeleccionar(p)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.ciudad}</td>
                  <td className={styles.tdMuted}>{p.fecha ?? "-"}</td>
                  <td>{p.usuarioNombre}</td>
                  <td>{p.estado}</td>
                  <td className={styles.tdMuted}>{p.programado ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

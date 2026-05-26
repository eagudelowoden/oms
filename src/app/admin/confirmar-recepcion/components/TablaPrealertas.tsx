"use client";

import React, { useState, useEffect } from "react";
import styles from "../css/confirmar-recepcion.module.css";
import { PrealertaRecepcionRow } from "@/app/services/confirmar-recepcion.service";

interface Props {
  prealertas: PrealertaRecepcionRow[];
  isLoading: boolean;
  seleccionada: PrealertaRecepcionRow | null;
  onSeleccionar: (p: PrealertaRecepcionRow) => void;
  onRefresh: () => void;
  onDeseleccionar?: () => void;
}

function EstadoBadge({ estado }: { estado: string }) {
  const cls =
    estado.toLowerCase() === "recibido"
      ? styles.badgeRecibido
      : styles.badgeEnviado;
  return <span className={cls}>{estado}</span>;
}

export default function TablaPrealertas({
  prealertas,
  isLoading,
  seleccionada,
  onSeleccionar,
  onRefresh,
  onDeseleccionar,
}: Props) {
  const [ciudadFiltro, setCiudadFiltro] = useState("");

  const ciudades = [...new Set(prealertas.map((p) => p.ciudad ?? "").filter(Boolean))].sort();
  const filtered = ciudadFiltro
    ? prealertas.filter((p) => p.ciudad === ciudadFiltro)
    : prealertas;

  useEffect(() => {
    if (seleccionada && !filtered.find((p) => p.id === seleccionada.id)) {
      onDeseleccionar?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciudadFiltro]);

  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <div className={styles.cardInnerLeft}>
          <span className={styles.cardInnerTitle}>Prealertas enviadas</span>
          <span className={styles.countPill}>{filtered.length}</span>
        </div>
        <button
          className={styles.btnRefresh}
          onClick={() => onRefresh()}
          disabled={isLoading}
          title="Refrescar"
        >
          <span className={`material-symbols-rounded ${isLoading ? styles.spinning : ""}`}>
            refresh
          </span>
        </button>
      </div>

      {/* ── City filter ── */}
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "0.5px solid var(--c-border)",
          background: "var(--c-bg)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className={styles.cityFilterWrap}>
          <span className={`material-symbols-rounded ${styles.cityFilterIcon}`}>location_on</span>
          <select
            className={styles.cityFilterSelect}
            value={ciudadFiltro}
            onChange={(e) => setCiudadFiltro(e.target.value)}
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <svg
            className={styles.cityFilterChevron}
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M2 3.5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
              <th>Enviado el</th>
              <th>Recibido el</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className={styles.emptyCell}>
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyCell}>
                  No hay prealertas enviadas
                </td>
              </tr>
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
                  <td>
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className={styles.tdMuted}>{p.fechaEnvio ?? "-"}</td>
                  <td className={styles.tdMuted}>{p.fechaRecepcion ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

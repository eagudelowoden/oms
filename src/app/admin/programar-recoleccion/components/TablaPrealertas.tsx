"use client";

import React, { useState } from "react";
import styles from "../css/programar.module.css";
import { PrealertaRecoleccionRow } from "@/app/services/programar-recoleccion.service";

interface Props {
  prealertas: PrealertaRecoleccionRow[];
  isLoading: boolean;
  seleccionada: PrealertaRecoleccionRow | null;
  onSeleccionar: (p: PrealertaRecoleccionRow) => void;
  onRefresh: () => void;
}

function EstadoBadge({ estado }: { estado: string }) {
  const esAutorizado = estado.toLowerCase() === "autorizado";
  return (
    <span className={esAutorizado ? styles.badgeAutorizado : styles.badgePendiente}>
      {estado}
    </span>
  );
}

export default function TablaPrealertas({
  prealertas,
  isLoading,
  seleccionada,
  onSeleccionar,
  onRefresh,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? prealertas.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.ciudad ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : prealertas;

  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <div className={styles.cardInnerLeft}>
          <span className={styles.cardInnerTitle}>Prealertas</span>
          <span className={styles.countPill}>{filtered.length}</span>
        </div>
        <div className={styles.cardInnerRight}>
          <div className={styles.filterWrap}>
            <span className="material-symbols-rounded" style={{ fontSize: 13, color: "var(--c-hint)" }}>
              search
            </span>
            <input
              className={styles.filterInput}
              type="text"
              placeholder="Nombre o ciudad…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.filterClear} onClick={() => setQuery("")} title="Limpiar">
                <span className="material-symbols-rounded" style={{ fontSize: 13 }}>close</span>
              </button>
            )}
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
              <th>Autorizado</th>
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
                  No hay prealertas
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
                  <td className={styles.tdMuted}>{p.programado ?? "-"}</td>
                  <td className={styles.tdMuted}>{p.noAutorizacion ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

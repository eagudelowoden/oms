"use client";

import React from "react";
import styles from "../css/consolidar-prealertas.module.css";
import { PrealertaConsolidarRow } from "@/app/services/consolidar-prealertas.service";

interface Props {
  prealertas: PrealertaConsolidarRow[];
  isLoading: boolean;
  seleccionadas: Set<number>;
  onToggle: (p: PrealertaConsolidarRow) => void;
  onRefresh: () => void;
}

export default function TablaPrealertas({
  prealertas,
  isLoading,
  seleccionadas,
  onToggle,
  onRefresh,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Prealertas</span>
          <span className={styles.countPill}>{prealertas.length}</span>
          {seleccionadas.size > 0 && (
            <span className={styles.countPillSelected}>
              {seleccionadas.size} seleccionada{seleccionadas.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          className={styles.btnRefresh}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refrescar"
        >
          <span
            className={`material-symbols-rounded ${isLoading ? styles.spinning : ""}`}
          >
            refresh
          </span>
        </button>
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
              <th>Recepción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>Cargando...</td>
              </tr>
            ) : prealertas.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  No hay prealertas disponibles para consolidar
                </td>
              </tr>
            ) : (
              prealertas.map((p) => (
                <tr
                  key={p.id}
                  className={seleccionadas.has(p.id) ? styles.trSelected : ""}
                  onClick={() => onToggle(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(p.id)}
                      onChange={() => onToggle(p)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className={styles.tdMuted}>{p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.ciudad}</td>
                  <td className={styles.tdMuted}>{p.fecha ?? "-"}</td>
                  <td>{p.usuarioNombre}</td>
                  <td>
                    <span className={styles.badgeRecepcion}>{p.estado}</span>
                  </td>
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

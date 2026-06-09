"use client";

import React from "react";
import styles from "../css/consolidar-prealertas.module.css";
import { PrealertaConsolidadaRow } from "@/app/services/consolidar-prealertas.service";

interface Props {
  consolidadas: PrealertaConsolidadaRow[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TablaConsolidadas({ consolidadas, isLoading, onRefresh }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Top 10 últimas prealertas consolidadas</span>
          <span className={styles.countPill}>{consolidadas.length}</span>
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
              <th>Id</th>
              <th>Nombre</th>
              <th>Prealertas origen</th>
              <th>Creada</th>
              <th>Creado por</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>Cargando...</td>
              </tr>
            ) : consolidadas.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  No hay prealertas consolidadas aún
                </td>
              </tr>
            ) : (
              consolidadas.map((c) => (
                <tr key={c.id}>
                  <td className={styles.tdMuted}>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td className={styles.tdMuted}>{c.prealertasOrigen}</td>
                  <td className={styles.tdMuted}>{c.fecha ?? "-"}</td>
                  <td>{c.creadoPor}</td>
                  <td>
                    <span className={styles.badgeConsolidada}>{c.estado}</span>
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

"use client";

import React from "react";
import styles from "../css/programar.module.css";
import { MaterialRow } from "@/app/services/programar-recoleccion.service";

interface Props {
  materiales: MaterialRow[];
  cargando: boolean;
}

export default function TablaMateriales({ materiales, cargando }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <span className={styles.cardInnerTitle}>Materiales</span>
        <span className={styles.countPill}>{materiales.length}</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Sap</th>
              <th>Serial</th>
              <th>Mac</th>
              <th>Caja</th>
              <th>Estado</th>
              <th>Cant.</th>
              <th>Tipo</th>
              <th>Técnico</th>
              <th>Trámite</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={10} className={styles.emptyCell}>
                  Cargando materiales...
                </td>
              </tr>
            ) : materiales.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.emptyCell}>
                  Selecciona una prealerta para ver sus materiales
                </td>
              </tr>
            ) : (
              materiales.map((m, i) => (
                <tr key={`${m.serial}-${i}`}>
                  <td>{m.descripcion || "-"}</td>
                  <td className={styles.tdMuted}>{m.codigoSap || "-"}</td>
                  <td style={{ fontFamily: "Courier New, monospace", fontWeight: 600 }}>
                    {m.serial}
                  </td>
                  <td className={styles.tdMuted} style={{ fontFamily: "Courier New, monospace", fontSize: 11 }}>
                    {m.mac ?? "-"}
                  </td>
                  <td className={styles.tdMuted}>{m.caja > 0 ? m.caja : "-"}</td>
                  <td>
                    <span
                      className={
                        m.estado === "Empacado"
                          ? styles.badgeEmpacado
                          : styles.badgeDisponible
                      }
                    >
                      {m.estado}
                    </span>
                  </td>
                  <td>{m.cantidad}</td>
                  <td className={styles.tdMuted}>{m.tipo}</td>
                  <td>{m.tecnico || "-"}</td>
                  <td className={styles.tdMuted}>{m.tramite || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

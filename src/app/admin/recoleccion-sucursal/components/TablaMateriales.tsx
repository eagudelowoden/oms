"use client";

import React from "react";
import styles from "../css/recoleccion.module.css";
import { SerialRecoleccionRow } from "@/app/services/recoleccion-sucursal.service";

interface Props {
  seriales: SerialRecoleccionRow[];
  cargando: boolean;
  onEscanear: () => void;
}

export default function TablaMateriales({ seriales, cargando, onEscanear }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Materiales</span>
          <span className={styles.countPill}>{seriales.length}</span>
        </div>
        <button className={styles.btnEscanear} onClick={onEscanear}>
          <span className="material-symbols-rounded">qr_code_scanner</span>
          Escanear
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Material</th>
              <th>Sap</th>
              <th>Serial</th>
              <th>Mac</th>
              <th>Caja</th>
              <th>Cant.</th>
              <th>Técnico</th>
              <th>Trámite</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={9} className={styles.emptyCell}>Cargando materiales...</td></tr>
            ) : seriales.length === 0 ? (
              <tr><td colSpan={9} className={styles.emptyCell}>Selecciona una prealerta para ver los seriales</td></tr>
            ) : (
              seriales.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.recogido === 1 ? (
                      <span className={styles.icoOk}>✓</span>
                    ) : (
                      <span className={styles.icoPending} />
                    )}
                  </td>
                  <td>{s.descripcion || "-"}</td>
                  <td className={styles.tdMuted}>{s.codigoSap || "-"}</td>
                  <td className={styles.tdMono}>{s.serial}</td>
                  <td className={styles.tdMono} style={{ fontSize: 11 }}>{s.mac ?? "-"}</td>
                  <td className={styles.tdMuted}>{s.caja > 0 ? s.caja : "-"}</td>
                  <td>{s.cantidad}</td>
                  <td>{s.tecnico || "-"}</td>
                  <td className={styles.tdMuted}>{s.tramite || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

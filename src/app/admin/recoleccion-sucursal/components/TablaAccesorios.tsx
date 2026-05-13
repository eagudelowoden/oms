"use client";

import React from "react";
import styles from "../css/recoleccion.module.css";
import { AccesorioRecoleccionRow } from "@/app/services/recoleccion-sucursal.service";

interface Props {
  accesorios: AccesorioRecoleccionRow[];
  cargando: boolean;
  onUpdateCantidad: (id: number, cantidad: number) => void;
}

export default function TablaAccesorios({ accesorios, cargando, onUpdateCantidad }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Accesorios</span>
          <span className={styles.countPill}>{accesorios.length}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Material</th>
              <th>Sap</th>
              <th>Recibido</th>
              <th>Caja</th>
              <th>Cant.</th>
              <th>Técnico</th>
              <th>Trámite</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} className={styles.emptyCell}>Cargando accesorios...</td></tr>
            ) : accesorios.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyCell}>Selecciona una prealerta para ver los accesorios</td></tr>
            ) : (
              accesorios.map((a) => {
                const ok = a.cantidadRecibida >= a.cantidad;
                return (
                  <tr key={a.id}>
                    <td>
                      {a.cantidadRecibida > 0 ? (
                        ok ? (
                          <span className={styles.icoOk}>✓</span>
                        ) : (
                          <span className={styles.icoFail}>✗</span>
                        )
                      ) : (
                        <span className={styles.icoPending} />
                      )}
                    </td>
                    <td>{a.descripcion || "-"}</td>
                    <td className={styles.tdMuted}>{a.codigoSap || "-"}</td>
                    <td>
                      <input
                        type="number"
                        className={styles.inputCantidad}
                        defaultValue={a.cantidadRecibida || ""}
                        min={0}
                        max={a.cantidad}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val !== a.cantidadRecibida) {
                            onUpdateCantidad(a.id, val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                      />
                    </td>
                    <td className={styles.tdMuted}>{a.caja > 0 ? a.caja : "-"}</td>
                    <td>{a.cantidad}</td>
                    <td>{a.tecnico || "-"}</td>
                    <td className={styles.tdMuted}>{a.tramite || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

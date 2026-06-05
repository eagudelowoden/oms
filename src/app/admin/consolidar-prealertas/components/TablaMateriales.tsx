"use client";

import React from "react";
import styles from "../css/consolidar-prealertas.module.css";
import {
  MaterialConsolidarRow,
  AccesorioConsolidarRow,
} from "@/app/services/consolidar-prealertas.service";

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span
      className={
        estado === "Empacado" ? styles.badgeEmpacado : styles.badgeSinEmpacar
      }
    >
      {estado}
    </span>
  );
}

interface MaterialesProps {
  materiales: MaterialConsolidarRow[];
  isLoading: boolean;
}

export function TablaMateriales({ materiales, isLoading }: MaterialesProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Materiales</span>
          <span className={styles.countPill}>{materiales.length}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input type="checkbox" disabled />
              </th>
              <th>Material</th>
              <th>Prealerta</th>
              <th>Sap</th>
              <th>Serial</th>
              <th>Caja</th>
              <th>Estado</th>
              <th>Ciudad</th>
              <th>Tipo</th>
              <th>Técnico</th>
              <th>Conf. Serie</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className={styles.emptyCell}>Cargando...</td>
              </tr>
            ) : materiales.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.emptyCell}>
                  Selecciona prealertas para ver los materiales
                </td>
              </tr>
            ) : (
              materiales.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input type="checkbox" disabled />
                  </td>
                  <td>{m.descripcion}</td>
                  <td className={styles.tdMuted}>{m.prealertaNombre}</td>
                  <td className={styles.tdMuted}>{m.codigoSap}</td>
                  <td>{m.serial}</td>
                  <td className={styles.tdMuted}>{m.caja}</td>
                  <td>
                    <EstadoBadge estado={m.estado} />
                  </td>
                  <td>{m.ciudad}</td>
                  <td className={styles.tdMuted}>{m.tipo}</td>
                  <td>{m.tecnico}</td>
                  <td>
                    <input
                      className={styles.confInput}
                      value={m.serial}
                      readOnly
                    />
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

interface AccesoriosProps {
  accesorios: AccesorioConsolidarRow[];
  isLoading: boolean;
}

export function TablaAccesorios({ accesorios, isLoading }: AccesoriosProps) {
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
              <th>
                <input type="checkbox" disabled />
              </th>
              <th>Material</th>
              <th>Prealerta</th>
              <th>Sap</th>
              <th>Cant.</th>
              <th>Caja</th>
              <th>Estado</th>
              <th>Ciudad</th>
              <th>Tipo</th>
              <th>Técnico</th>
              <th>Conf. Cant.</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={11} className={styles.emptyCell}>Cargando...</td>
              </tr>
            ) : accesorios.length === 0 ? (
              <tr>
                <td colSpan={11} className={styles.emptyCell}>
                  Selecciona prealertas para ver los accesorios
                </td>
              </tr>
            ) : (
              accesorios.map((a) => (
                <tr key={a.id}>
                  <td>
                    <input type="checkbox" disabled />
                  </td>
                  <td>{a.descripcion}</td>
                  <td className={styles.tdMuted}>{a.prealertaNombre}</td>
                  <td className={styles.tdMuted}>{a.codigoSap}</td>
                  <td>{a.cantidad}</td>
                  <td className={styles.tdMuted}>{a.caja}</td>
                  <td>
                    <EstadoBadge estado={a.estado} />
                  </td>
                  <td>{a.ciudad}</td>
                  <td className={styles.tdMuted}>{a.tipo}</td>
                  <td>{a.tecnico}</td>
                  <td>
                    <input
                      className={styles.confInput}
                      value={a.cantidad}
                      readOnly
                    />
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

"use client";

import React from "react";
import styles from "../css/recoleccion.module.css";

interface Props {
  serialesARecoger: number;
  serialesRecogidos: number;
  accesoriosARecoger: number;
  accesoriosRecogidos: number;
}

export default function StatsHeader({
  serialesARecoger,
  serialesRecogidos,
  accesoriosARecoger,
  accesoriosRecogidos,
}: Props) {
  const pctSeriales =
    serialesARecoger > 0
      ? Math.round((serialesRecogidos / serialesARecoger) * 100)
      : 0;
  const pctAccesorios =
    accesoriosARecoger > 0
      ? Math.round((accesoriosRecogidos / accesoriosARecoger) * 100)
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Seriales a Recoger</span>
          <span className={styles.statValue}>{serialesARecoger}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Seriales Recogidos</span>
          <span className={styles.statValue}>{serialesRecogidos}</span>
        </div>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statLabel}>Accesorios a Recoger</span>
          <span className={styles.statValue}>{accesoriosARecoger}</span>
        </div>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <span className={styles.statLabel}>Accesorios Recogidos</span>
          <span className={styles.statValue}>{accesoriosRecogidos}</span>
        </div>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${pctSeriales}%` }}
          />
          <span className={styles.progressLabel}>{pctSeriales}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles.blue}`}
            style={{ width: `${pctAccesorios}%` }}
          />
          <span className={styles.progressLabel}>{pctAccesorios}%</span>
        </div>
      </div>
    </div>
  );
}

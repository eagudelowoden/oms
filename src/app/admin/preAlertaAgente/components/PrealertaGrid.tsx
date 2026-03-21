import React from "react";
import styles from "../prealerta.module.css";

/* ── SERIALES ESCANEADOS ── */
interface SerialesProps {
  seriales: string[];
  onRemove: (idx: number) => void;
}

export function PrealertaSeriales({ seriales, onRemove }: SerialesProps) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <span className={styles.cardInnerTitle}>Seriales escaneados</span>
        {seriales.length > 0 && (
          <span className={styles.countPill}>{seriales.length}</span>
        )}
      </div>
      <div className={styles.checkList}>
        {seriales.length === 0 ? (
          <div className={styles.emptySeriales}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <rect x="3" y="3" width="5" height="5" rx="1"/>
              <rect x="12" y="3" width="5" height="5" rx="1"/>
              <rect x="3" y="12" width="5" height="5" rx="1"/>
              <path d="M12 12h2v2h-2zM14 14h3M14 12h3M12 14v3"/>
            </svg>
            <p>Sin seriales aún — escanea para ver aquí</p>
          </div>
        ) : (
          seriales.map((serial, i) => (
            <div key={i} className={styles.serialRow}>
              <div className={styles.serialRowLeft}>
                <span className={styles.serialRowDot}/>
                <span className={styles.serialRowCode}>{serial}</span>
              </div>
              <button type="button" className={styles.serialRowRemove} onClick={() => onRemove(i)}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9"/>
                  <line x1="9" y1="1" x2="1" y2="9"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── MATERIAL / CAJA ── */
export function PrealertaMaterial() {
  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <span className={styles.cardInnerTitle}>Material — caja asignada</span>
      </div>
      <table className={styles.miniTable}>
        <thead>
          <tr>
            <th>Tipo Material</th>
            <th>Caja Asignada</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Equipos</td>
            <td><input type="text" placeholder="Ej: J-12" className={styles.miniInput}/></td>
          </tr>
          <tr>
            <td>Accesorios</td>
            <td><input type="text" placeholder="Ej: J-13" className={styles.miniInput}/></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

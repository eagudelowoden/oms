import React from "react";
import styles from "../prealerta.module.css";
import { SerialItem } from "../hooks/usePrealerta";

/* ── SERIALES ESCANEADOS ── */
interface SerialesProps {
  seriales: SerialItem[];
  seleccionados: Set<number>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
  onRemove: (idx: number) => void;
}

export function PrealertaSeriales({
  seriales,
  seleccionados,
  onToggle,
  onToggleAll,
  onRemove,
}: SerialesProps) {
  const todosSeleccionados =
    seriales.length > 0 && seleccionados.size === seriales.length;
  const algunoSeleccionado = seleccionados.size > 0 && !todosSeleccionados;

  return (
    <div className={styles.card}>
      <div className={styles.cardInnerHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Checkbox "seleccionar todos" */}
          {seriales.length > 0 && (
            <input
              type="checkbox"
              checked={todosSeleccionados}
              ref={(el) => {
                if (el) el.indeterminate = algunoSeleccionado;
              }}
              onChange={onToggleAll}
              style={{
                cursor: "pointer",
                accentColor: "#2563eb",
                width: 13,
                height: 13,
              }}
            />
          )}
          <span className={styles.cardInnerTitle}>Seriales escaneados</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {seleccionados.size > 0 && (
            <span className={styles.countPillSelected}>
              {seleccionados.size} selec.
            </span>
          )}
          {seriales.length > 0 && (
            <span className={styles.countPill}>{seriales.length}</span>
          )}
        </div>
      </div>

      <div className={styles.checkList}>
        {seriales.length === 0 ? (
          <div className={styles.emptySeriales}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            >
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <path d="M12 12h2v2h-2zM14 14h3M14 12h3M12 14v3" />
            </svg>
            <p>Sin seriales aún — escanea o sincroniza para ver aquí</p>
          </div>
        ) : (
          seriales.map((item, i) => {
            const marcado = seleccionados.has(i);
            return (
              <div
                key={i}
                className={styles.serialRow}
                style={marcado ? { background: "#eff6ff" } : undefined}
                onClick={() => onToggle(i)}
              >
                <div className={styles.serialRowLeft}>
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => onToggle(i)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      cursor: "pointer",
                      accentColor: "#2563eb",
                      width: 13,
                      height: 13,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className={styles.serialRowDot}
                    style={
                      item.origen === "api"
                        ? {
                            background: "#2563eb",
                            boxShadow: "0 0 4px rgba(37,99,235,0.4)",
                          }
                        : undefined
                    }
                  />
                  <span className={styles.serialRowCode}>{item.codigo}</span>
                  <span
                    className={
                      item.origen === "api"
                        ? styles.badgeApi
                        : styles.badgeManual
                    }
                  >
                    {item.origen === "api" ? "API" : "Manual"}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.serialRowRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <line x1="1" y1="1" x2="9" y2="9" />
                    <line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── MATERIAL / CAJA ── */
export function PrealertaMaterial() {
  return (
    <div className={styles.card}>
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
            <td>
              <input
                type="text"
                placeholder="Ej: J-12"
                className={styles.miniInput}
              />
            </td>
          </tr>
          <tr>
            <td>Accesorios</td>
            <td>
              <input
                type="text"
                placeholder="Ej: J-13"
                className={styles.miniInput}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

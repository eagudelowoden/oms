import React from "react";
import styles from "../prealerta.module.css";
import { SerialItem } from "../hooks/usePrealerta";

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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Familia</th>
                <th>Serial</th>
                <th>Caja</th>
                <th>Estado</th>
                <th>Cant</th>
                <th>Tipo</th>
                <th>Técnico</th>
                <th>Trámite</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {seriales.map((item, i) => {
                const marcado = seleccionados.has(i);
                return (
                  <tr
                    key={i}
                    className={marcado ? styles.trSelected : ""}
                    onClick={() => onToggle(i)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Checkbox */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => onToggle(i)}
                        style={{
                          cursor: "pointer",
                          accentColor: "#2563eb",
                          width: 13,
                          height: 13,
                        }}
                      />
                    </td>

                    {/* Familia */}
                    <td>
                      <span
                        className={
                          item.origen === "api"
                            ? styles.badgeApi
                            : styles.badgeManual
                        }
                      >
                        {item.origen === "api" ? "API" : "Manual"}
                      </span>
                    </td>

                    {/* Serial */}
                    <td className={styles.serialRowCode}>{item.codigo}</td>

                    {/* Caja */}
                    <td className={styles.tdMuted}>—</td>

                    {/* Estado */}
                    <td>
                      <span className={styles.estadoPill}>Empacado</span>
                    </td>

                    {/* Cant */}
                    <td className={styles.tdMuted}>1</td>

                    {/* Tipo */}
                    <td className={styles.tdMuted}>Serializable</td>

                    {/* Técnico */}
                    <td className={styles.tdMuted}>—</td>

                    {/* Trámite */}
                    <td className={styles.tdMuted}>—</td>

                    {/* Eliminar */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.btnDel}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(i);
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        >
                          <polyline points="2.5,4 11.5,4" />
                          <path d="M5 4V3h4v1" />
                          <path d="M4 4l.6 7.5h4.8L10 4" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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

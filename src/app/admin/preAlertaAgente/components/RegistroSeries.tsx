import React, { useState } from "react";
import styles from "../registroSeries.module.css";
import preStyles from "../prealerta.module.css";

const FAMILIAS = [
  { value: "", label: "Ninguna..." },
  { value: "equipos", label: "Equipos" },
  { value: "accesorios", label: "Accesorios" },
];

export default function RegistroSeries() {
  const [familia, setFamilia] = useState("");
  const [serial, setSerial] = useState("");
  const [tipo, setTipo] = useState<"serializable" | "no-serializable">(
    "serializable",
  );
  const [cant, setCant] = useState(1);

  const esSerialiable = tipo === "serializable";
  const familiaSeleccionada = familia !== "";

  const handleGuardar = () => {
    console.log({ familia, serial, tipo, cant });
    setSerial("");
    setCant(1);
  };

  return (
    <div className={styles.registroCard}>
      <div className={preStyles.cardInnerHeader}>
        <span className={preStyles.cardInnerTitle}>Registro Series</span>
      </div>

      <div className={styles.registroBody}>
        {/* Fila: Familia */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Familia Acc</label>
          <select
            className={styles.registroSelect}
            value={familia}
            onChange={(e) => setFamilia(e.target.value)}
          >
            {FAMILIAS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          {familiaSeleccionada && (
            <span className={styles.registroHint}>
              ⚠ Con familia no se puede serializar ni ingresar Tipo
            </span>
          )}
        </div>

        {/* Fila: Serial */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Serial</label>
          <input
            type="text"
            className={styles.registroInput}
            placeholder="Ingresa el serial..."
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            disabled={familiaSeleccionada}
          />
          {!familiaSeleccionada && (
            <span className={styles.registroHint}>Serializable</span>
          )}
        </div>

        {/* Fila: Tipo */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Tipo</label>
          <select
            className={styles.registroSelect}
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as "serializable" | "no-serializable")
            }
            disabled={familiaSeleccionada}
          >
            <option value="serializable">Serializable</option>
            <option value="no-serializable">No serializable</option>
          </select>
        </div>

        {/* Fila: Cant */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Cant</label>
          <input
            type="number"
            className={styles.registroInput}
            value={esSerialiable ? 1 : cant}
            min={1}
            onChange={(e) => setCant(Number(e.target.value))}
            disabled={esSerialiable}
            style={{ width: 80 }}
          />
          <span className={styles.registroHint}>
            {esSerialiable ? "Siempre 1 para serializable" : ""}
          </span>
        </div>

        {/* Guardar */}
        <button
          type="button"
          className={styles.btnGuardar}
          onClick={handleGuardar}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

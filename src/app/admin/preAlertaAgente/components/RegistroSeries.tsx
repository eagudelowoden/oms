import React, { useState } from "react";
import styles from "../registroSeries.module.css";
import preStyles from "../prealerta.module.css";
import { SerialItem } from "../hooks/usePrealerta";

const FAMILIAS = [
  { value: "", label: "Ninguna..." },
  { value: "equipos", label: "Equipos" },
  { value: "accesorios", label: "Accesorios" },
];
interface Props {
  seleccionados: Set<number>;
  onActualizarTipo: (tipo: "Serializable" | "No-serializable") => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
}

export default function RegistroSeries({
  seleccionados,
  onActualizarTipo,
  onShowToast,
}: Props) {
  const [familia, setFamilia] = useState("");
  const [serial, setSerial] = useState("");
  const [mac, setMac] = useState(""); // ← nuevo
  const [tipo, setTipo] = useState<"Serializable" | "No-serializable">(
    "Serializable",
  );
  const [cant, setCant] = useState(1);

  const esSerialiable = tipo === "Serializable";
  const familiaSeleccionada = familia !== "";
  // En handleGuardar:
  const handleGuardar = () => {
    if (seleccionados.size === 0) {
      onShowToast("Selecciona seriales en la tabla primero", "error");
      return;
    }
    onActualizarTipo(tipo); // ← nuevo: actualiza tipo de los seleccionados
    onShowToast(`✓ Tipo "${tipo}" asignado a ${seleccionados.size} serial(es)`);
  };
  return (
    <div className={styles.registroCard}>
      <div className={preStyles.cardInnerHeader}>
        <span className={preStyles.cardInnerTitle}>Registro Accesorios</span>
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
              setTipo(e.target.value as "Serializable" | "No-serializable")
            }
            disabled={familiaSeleccionada}
          >
            <option value="Serializable">Serializable</option>
            <option value="No-serializable">No serializable</option>
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

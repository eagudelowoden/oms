import React from "react";
import styles from "../css/prealerta.module.css";
import { SerialItem } from "@/app/models/seriales.models";

interface Props {
  isOpen: boolean;
  seriales: SerialItem[];
  guardando: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ModalPrevistaSeriales({
  isOpen,
  seriales,
  guardando,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div
        className={styles.confirmBox}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: "95vw" }}
      >
        {/* Ícono */}
        <svg
          className={styles.confirmIcon}
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M9 12l2 2 4-4" />
          <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>

        <p className={styles.confirmTitle}>
          {seriales.length} serial{seriales.length !== 1 ? "es" : ""} encontrado{seriales.length !== 1 ? "s" : ""}
        </p>
        <p className={styles.confirmSub}>
          Revisa los seriales antes de guardarlos. Se guardarán como <strong>Disponible</strong> (sin empacar).
        </p>

        {/* Lista de seriales */}
        <div
          style={{
            width: "100%",
            maxHeight: 280,
            overflowY: "auto",
            marginTop: 12,
            border: "0.5px solid #e2e8f0",
            borderRadius: 8,
            background: "#f8fafc",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>
                  Serial
                </th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>
                  Cód. SAP
                </th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody>
              {seriales.map((s, i) => (
                <tr
                  key={s.codigo}
                  style={{
                    borderTop: i > 0 ? "0.5px solid #e2e8f0" : undefined,
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  <td style={{ padding: "5px 10px", fontFamily: "'Courier New', monospace", fontWeight: 600, color: "#1e293b" }}>
                    {s.codigo}
                  </td>
                  <td style={{ padding: "5px 10px", color: "#475569" }}>
                    {s.codigo_sap ?? "—"}
                  </td>
                  <td style={{ padding: "5px 10px", color: "#64748b" }}>
                    {s.descripcion ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.confirmBtns}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={onClose}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={onConfirm}
            disabled={guardando || seriales.length === 0}
            style={{
              background: guardando ? "#94a3b8" : "#2563eb",
              cursor: guardando ? "not-allowed" : "pointer",
            }}
          >
            {guardando ? "Guardando…" : `Guardar ${seriales.length} serial${seriales.length !== 1 ? "es" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

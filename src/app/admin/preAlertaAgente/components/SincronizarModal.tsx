import React, { useState, useEffect } from "react";
import styles from "../prealerta.module.css";

interface Props {
  isOpen: boolean;
  fecha: string;
  onClose: () => void;
  onConfirm: (fecha: string, documento: string) => void;
}

export default function SincronizarModal({ isOpen, fecha, onClose, onConfirm }: Props) {
  const [documento, setDocumento] = useState("");
  const [fechaLocal, setFechaLocal] = useState(fecha);

  // Pre-llenar con el documento del usuario en sesión
  useEffect(() => {
    if (!isOpen) return;
    setFechaLocal(fecha);
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) {
        const u = JSON.parse(raw);
        // intentar campo documento_identidad o cedula o numeroDocumento
        const doc = u.documento_identidad ?? u.cedula ?? u.numeroDocumento ?? u.documento ?? "";
        setDocumento(String(doc));
      }
    } catch (_) {}
  }, [isOpen, fecha]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!documento.trim()) return;
    onConfirm(fechaLocal, documento.trim());
    onClose();
  };

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div
        className={styles.confirmBox}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 340 }}
      >
        {/* Ícono */}
        <svg
          className={styles.confirmIcon}
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <path d="M12 8v4l2 2" />
        </svg>

        <p className={styles.confirmTitle}>Sincronizar seriales</p>
        <p className={styles.confirmSub}>Ingresa tu documento para traer solo tus registros</p>

        {/* Fecha */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <label style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>
            Fecha proceso
          </label>
          <input
            type="date"
            value={fechaLocal}
            onChange={(e) => setFechaLocal(e.target.value)}
            style={{
              width: "100%", marginTop: 4, padding: "7px 10px",
              border: "0.5px solid #e2e8f0", borderRadius: 8,
              fontSize: 12, fontFamily: "'Courier New', monospace",
              outline: "none", boxSizing: "border-box", color: "#1e293b",
              background: "#f8fafc",
            }}
          />
        </div>

        {/* Documento */}
        <div style={{ width: "100%", marginTop: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8" }}>
            Documento de identidad
          </label>
          <input
            type="text"
            placeholder="Ej: 18399885"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            autoFocus
            style={{
              width: "100%", marginTop: 4, padding: "7px 10px",
              border: `0.5px solid ${documento ? "#2563eb" : "#e2e8f0"}`,
              borderRadius: 8, fontSize: 13,
              fontFamily: "'Courier New', monospace", fontWeight: 600,
              outline: "none", boxSizing: "border-box", color: "#1e293b",
              background: "#f8fafc",
              boxShadow: documento ? "0 0 0 2px rgba(37,99,235,0.08)" : "none",
            }}
          />
        </div>

        <div className={styles.confirmBtns}>
          <button type="button" className={styles.confirmCancel} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={handleConfirm}
            disabled={!documento.trim()}
            style={{
              background: documento.trim() ? "#2563eb" : "#94a3b8",
              cursor: documento.trim() ? "pointer" : "not-allowed",
            }}
          >
            Sincronizar
          </button>
        </div>
      </div>
    </div>
  );
}

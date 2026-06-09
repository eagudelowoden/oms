import React, { useState, useEffect } from "react";
import styles from "../css/prealerta.module.css";
import { PropsSincronizarSeriales } from "@/app/models/apiSeriales.models";

function getDocumentoFromStorage(): string {
  try {
    const raw = localStorage.getItem("usuario");
    if (raw) {
      const u = JSON.parse(raw);
      return String(u.documento_identidad ?? u.cedula ?? u.numeroDocumento ?? u.documento ?? "");
    }
  } catch (_) {}
  return "";
}

export default function SincronizarModal({
  isOpen,
  fecha,
  sincronizando,
  serialesPrevista,
  guardando,
  onClose,
  onSincronizar,
  onGuardar,
  onVolver,
}: PropsSincronizarSeriales) {
  const [documento, setDocumento] = useState<string>(() => getDocumentoFromStorage());
  const [fechaLocal, setFechaLocal] = useState<string>(fecha);

  useEffect(() => { setFechaLocal(fecha); }, [fecha]);
  useEffect(() => {
    if (!isOpen) return;
    setDocumento(getDocumentoFromStorage());
  }, [isOpen]);

  if (!isOpen) return null;

  const enPrevista = serialesPrevista.length > 0;

  const handleSincronizar = () => {
    if (!documento.trim()) return;
    onSincronizar(fechaLocal, documento.trim());
  };

  /* ── PASO 1: FORMULARIO ── */
  if (!enPrevista) {
    return (
      <div className={styles.confirmOverlay} onClick={onClose}>
        <div
          className={styles.confirmBox}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: 340 }}
        >
          <svg
            className={styles.confirmIcon}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <path d="M12 8v4l2 2" />
          </svg>

          <p className={styles.confirmTitle}>Sincronizar seriales</p>
          <p className={styles.confirmSub}>
            Ingresa tu documento para traer solo tus registros
          </p>

          <div style={{ width: "100%", marginTop: 8 }}>
            <label style={labelStyle}>Fecha proceso</label>
            <input
              type="date"
              value={fechaLocal}
              onChange={(e) => setFechaLocal(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ width: "100%", marginTop: 10 }}>
            <label style={labelStyle}>Documento de identidad</label>
            <input
              type="text"
              placeholder="Ej: 18399885"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSincronizar()}
              autoFocus
              style={{
                ...inputStyle,
                border: `0.5px solid ${documento ? "#2563eb" : "#e2e8f0"}`,
                fontWeight: 600,
                fontSize: 13,
                boxShadow: documento ? "0 0 0 2px rgba(37,99,235,0.08)" : "none",
              }}
            />
          </div>

          <div className={styles.confirmBtns}>
            <button type="button" className={styles.confirmCancel} onClick={onClose} disabled={sincronizando}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.confirmDelete}
              onClick={handleSincronizar}
              disabled={!documento.trim() || sincronizando}
              style={{
                background: !documento.trim() || sincronizando ? "#94a3b8" : "#2563eb",
                cursor: !documento.trim() || sincronizando ? "not-allowed" : "pointer",
                minWidth: 110,
              }}
            >
              {sincronizando ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Spinner /> Consultando…
                </span>
              ) : "Sincronizar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── PASO 2: VISTA PREVIA ── */
  const sinSap = serialesPrevista.filter((s) => !s.descripcion).length;

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div
        className={styles.confirmBox}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640, width: "96vw" }}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
              {serialesPrevista.length} serial{serialesPrevista.length !== 1 ? "es" : ""} encontrado{serialesPrevista.length !== 1 ? "s" : ""}
            </p>
            {sinSap > 0 && (
              <p style={{ margin: 0, fontSize: 11, color: "#f59e0b", marginTop: 2 }}>
                ⚠ {sinSap} sin descripción SAP en BD
              </p>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div style={{
          width: "100%",
          maxHeight: 320,
          overflowY: "auto",
          marginTop: 14,
          border: "0.5px solid #e2e8f0",
          borderRadius: 8,
          background: "#f8fafc",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", position: "sticky", top: 0, zIndex: 1 }}>
                {["Serial", "MAC / IMEI", "Cód. SAP", "Descripción"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serialesPrevista.map((s, i) => {
                const sapValido = !!s.descripcion;
                return (
                  <tr key={s.codigo} style={{
                    borderTop: i > 0 ? "0.5px solid #e2e8f0" : undefined,
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}>
                    <td style={{ ...tdStyle, fontFamily: "'Courier New', monospace", fontWeight: 600, color: "#1e293b" }}>
                      {s.codigo}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "'Courier New', monospace", color: "#475569" }}>
                      {s.mac ?? <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, color: sapValido ? "#475569" : "#94a3b8" }}>
                      {s.codigo_sap ?? <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, color: sapValido ? "#64748b" : "#f59e0b" }}>
                      {s.descripcion ?? (s.codigo_sap ? "No encontrado en BD" : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Botones */}
        <div className={styles.confirmBtns}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={onVolver}
            disabled={guardando}
          >
            ← Volver
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={onGuardar}
            disabled={guardando}
            style={{
              background: guardando ? "#94a3b8" : "#2563eb",
              cursor: guardando ? "not-allowed" : "pointer",
              minWidth: 130,
            }}
          >
            {guardando ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Spinner /> Guardando…
              </span>
            ) : `Guardar ${serialesPrevista.length} serial${serialesPrevista.length !== 1 ? "es" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#94a3b8",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  padding: "7px 10px",
  border: "0.5px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "'Courier New', monospace",
  outline: "none",
  boxSizing: "border-box",
  color: "#1e293b",
  background: "#f8fafc",
};

const thStyle: React.CSSProperties = {
  padding: "6px 10px",
  textAlign: "left",
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  fontSize: 10,
};

const tdStyle: React.CSSProperties = {
  padding: "5px 10px",
};

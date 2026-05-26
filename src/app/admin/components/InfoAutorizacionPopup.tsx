"use client";

import React, { useEffect } from "react";

export interface InfoAutorizacion {
  id: number;
  noAutorizacion: string | null;
  observacion: string | null;
  creadoPor: string;
}

interface Props {
  info: InfoAutorizacion;
  onClose: () => void;
}

export default function InfoAutorizacionPopup({ info, onClose }: Props) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.35)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          minWidth: 320,
          maxWidth: 440,
          width: "100%",
          overflow: "hidden",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "0.5px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "#94a3b8",
            }}
          >
            Información de autorización
          </span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              fontSize: 16,
              lineHeight: 1,
              padding: 2,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="ID prealerta" value={String(info.id)} />
          <Row label="No. autorización" value={info.noAutorizacion ?? "—"} />
          <Row label="Observación" value={info.observacion || "—"} muted={!info.observacion} />
          <Row label="Creado por" value={info.creadoPor} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#94a3b8",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: muted ? "#94a3b8" : "#1e293b",
          fontWeight: muted ? 400 : 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

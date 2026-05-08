"use client";

import React, { useState, useRef } from "react";
import styles from "../css/registroSeries.module.css";
import MiniScannerCaptura from "./MiniScannerCaptura";
import { SerialItem } from "@/app/models/seriales.models";

interface Props {
  onAgregarSerial: (item: SerialItem) => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
  onClose?: () => void;
}

export default function RegistroManualSerial({ onAgregarSerial, onShowToast, onClose }: Props) {
  const [serialInput, setSerialInput] = useState("");
  const [macInput, setMacInput] = useState("");
  const [scanTarget, setScanTarget] = useState<"serial" | "mac" | null>(null);
  const serialRef = useRef<HTMLInputElement>(null);
  const macRef = useRef<HTMLInputElement>(null);

  const handleCapturar = (codigo: string) => {
    if (scanTarget === "serial") {
      setSerialInput(codigo.toUpperCase());
      setTimeout(() => macRef.current?.focus(), 50);
    } else if (scanTarget === "mac") {
      setMacInput(codigo.toUpperCase());
      setTimeout(() => serialRef.current?.focus(), 50);
    }
  };

  const handleRegistrar = () => {
    const serial = serialInput.trim().toUpperCase();
    if (!serial) {
      onShowToast("Ingresa un serial", "error");
      return;
    }
    const mac = macInput.trim().toUpperCase();

    onAgregarSerial({
      codigo: serial,
      mac: mac || undefined,
      origen: "manual" as const,
      tipo: "Serializable" as const,
      tramite: "Manual",
    });

    setSerialInput("");
    setMacInput("");
    serialRef.current?.focus();
    onShowToast(`✓ Serial ${serial} registrado`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, next?: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next ? next() : handleRegistrar();
    }
  };

  return (
    <>
      {/* Card del formulario — estilo mockup */}
      <div className={styles.registroCard} style={{ position: "relative" }}>

        {/* Botón X para cerrar */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 26,
              height: 26,
              background: "#64748b",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              zIndex: 2,
            }}
          >
            X
          </button>
        )}

        <div className={styles.cardInnerHeader}>
          <span className={styles.cardInnerTitle}>Registro Manual</span>
        </div>

        <div className={styles.registroBody}>
          {/* Serial */}
          <div className={styles.manualRow}>
            <label className={styles.manualFieldLabel}>Serial</label>
            <div className={styles.manualFieldWrap}>
              <input
                ref={serialRef}
                type="text"
                className={styles.manualFieldInput}
                placeholder="Ingresa o escanea el serial"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e, () => macRef.current?.focus())}
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.btnCamara}
                onClick={() => setScanTarget("serial")}
                title="Escanear serial"
              >
                <IcoCamara />
              </button>
            </div>
          </div>

          {/* MAC */}
          <div className={styles.manualRow}>
            <label className={styles.manualFieldLabel}>MAC</label>
            <div className={styles.manualFieldWrap}>
              <input
                ref={macRef}
                type="text"
                className={styles.manualFieldInput}
                placeholder="Ingresa o escanea la MAC"
                value={macInput}
                onChange={(e) => setMacInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => handleKeyDown(e)}
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.btnCamara}
                onClick={() => setScanTarget("mac")}
                title="Escanear MAC"
              >
                <IcoCamara />
              </button>
            </div>
          </div>

          {/* Botón Registrar */}
          <button
            type="button"
            className={styles.btnRegistrar}
            onClick={handleRegistrar}
            disabled={!serialInput.trim()}
          >
            Registrar
          </button>
        </div>
      </div>

      {/* Mini scanner de captura */}
      <MiniScannerCaptura
        isOpen={scanTarget !== null}
        onCapturar={handleCapturar}
        onClose={() => setScanTarget(null)}
      />
    </>
  );
}

function IcoCamara() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

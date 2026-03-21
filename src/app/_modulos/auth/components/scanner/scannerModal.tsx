"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./scanner.module.css";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (seriales: string[]) => void;
}

interface SerialItem {
  id: string;
  serial: string;
  timestamp: string;
}

interface CamaraDisponible {
  deviceId: string;
  label: string;
}

export default function ScannerModal({
  isOpen,
  onClose,
  onConfirm,
}: ScannerModalProps) {
  const [seriales, setSeriales] = useState<SerialItem[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [dupSerial, setDupSerial] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [flashScan, setFlashScan] = useState<"none" | "ok" | "dup">("none");
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [camaras, setCamaras] = useState<CamaraDisponible[]>([]);
  const [camaraActual, setCamaraActual] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const serialesRef = useRef<SerialItem[]>([]);
  const lastScanRef = useRef<{ serial: string; time: number }>({
    serial: "",
    time: 0,
  });

  useEffect(() => {
    serialesRef.current = seriales;
  }, [seriales]);

  /* ── SONIDO ── */
  const playBeep = useCallback((type: "ok" | "dup") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "ok") {
        // Beep corto y agudo — confirmación
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        // Beep grave — duplicado
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio no disponible:", e);
    }
  }, []);

  /* ── DETECTAR CÁMARAS TRASERAS ── */
  const detectarCamaras = useCallback(async () => {
    try {
      // Pedir permiso primero para obtener labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      // Filtrar cámaras traseras por label
      const traseras = videoDevices.filter((d) => {
        const label = d.label.toLowerCase();
        return (
          label.includes("back") ||
          label.includes("rear") ||
          label.includes("trasera") ||
          label.includes("environment") ||
          label.includes("wide") ||
          label.includes("ultra") ||
          label.includes("tele") ||
          label.includes("0,") // Android: "camera2 0, facing back"
        );
      });

      // Si no detectó traseras, usar todas
      const lista = traseras.length > 0 ? traseras : videoDevices;

      const camarasFormateadas: CamaraDisponible[] = lista.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Cámara ${i + 1}`,
      }));

      setCamaras(camarasFormateadas);
      // Usar la primera trasera detectada
      if (camarasFormateadas.length > 0 && !camaraActual) {
        setCamaraActual(camarasFormateadas[0].deviceId);
      }
      return camarasFormateadas;
    } catch (e) {
      console.error("Error detectando cámaras:", e);
      return [];
    }
  }, [camaraActual]);

  /* ── INICIAR CÁMARA ── */
  const iniciarCamara = useCallback(
    async (deviceId?: string) => {
      setCamError(null);
      setScanning(true);
      setTorchOn(false);
      setTorchAvailable(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (scannerRef.current) {
        try {
          scannerRef.current.reset?.();
        } catch (_) {}
        scannerRef.current = null;
      }

      try {
        let listaActual = camaras;
        if (camaras.length === 0) {
          listaActual = await detectarCamaras();
        }

        const idAUsar = deviceId ?? camaraActual ?? undefined;
        const constraints: MediaStreamConstraints = {
          video: idAUsar
            ? {
                deviceId: { exact: idAUsar },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        setTimeout(async () => {
          try {
            const capabilities = track.getCapabilities() as any;
            setTorchAvailable(
              "torch" in capabilities ? capabilities.torch : true,
            );
          } catch (_) {
            setTorchAvailable(true);
          }
        }, 600);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!videoRef.current) {
          setCamError("No se pudo inicializar el video.");
          setScanning(false);
          return;
        }

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const { DecodeHintType, BarcodeFormat } =
          await import("@zxing/library");

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const codeReader = new BrowserMultiFormatReader(hints);
        scannerRef.current = codeReader;

        const videoEl = videoRef.current;
        codeReader.decodeFromVideoElement(videoEl, (result: any) => {
          if (result) agregarSerial(result.getText());
        });
      } catch (err: any) {
        // ← MUESTRA EL ERROR COMPLETO EN PANTALLA
        const debugMsg = `${err?.name}: ${err?.message}${err?.constraint ? ` | constraint: ${err?.constraint}` : ""}`;

        const msg =
          err?.name === "NotAllowedError"
            ? `Permiso denegado — ${debugMsg}`
            : err?.name === "NotFoundError"
              ? `Cámara no encontrada — ${debugMsg}`
              : err?.name === "OverconstrainedError"
                ? `Configuración no soportada — ${debugMsg}`
                : err?.name === "NotReadableError"
                  ? `Cámara ocupada por otra app — ${debugMsg}`
                  : `Error desconocido — ${debugMsg}`;

        setCamError(msg);
        setScanning(false);
      }
    },
    [camaras, camaraActual, detectarCamaras],
  );

  /* ── CAMBIAR CÁMARA ── */
  const cambiarCamara = useCallback(
    async (deviceId: string) => {
      setCamaraActual(deviceId);
      if (scanning) await iniciarCamara(deviceId);
    },
    [scanning, iniciarCamara],
  );

  /* ── TOGGLE LINTERNA ── */
  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch (e) {
      console.warn("Torch no soportado:", e);
      setTorchAvailable(false);
    }
  }, [torchOn]);

  /* ── AGREGAR SERIAL ── */
  const agregarSerial = useCallback(
    (raw: string) => {
      const serial = raw.trim().toUpperCase();
      if (!serial) return;

      const now = Date.now();

      // Throttle más largo — 4 segundos para el mismo serial
      if (
        serial === lastScanRef.current.serial &&
        now - lastScanRef.current.time < 4000
      )
        return; // ← silencioso, cámara sigue leyendo el mismo código

      lastScanRef.current = { serial, time: now };

      // Verificar duplicado en la lista completa
      const yaExiste = serialesRef.current.some((s) => s.serial === serial);

      if (yaExiste) {
        setFlashScan("dup");
        playBeep("dup");
        setDupSerial(serial); // ← mostrar qué serial es duplicado
        setTimeout(() => {
          setFlashScan("none");
          setDupSerial(null);
        }, 2000);
        return;
      }

      // Serial nuevo
      setSeriales((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          serial,
          timestamp: new Date().toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
        ...prev,
      ]);

      setFlashScan("ok");
      playBeep("ok");
      setTimeout(() => setFlashScan("none"), 700);
    },
    [playBeep],
  );

  /* ── DETENER CÁMARA ── */
  const detenerCamara = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.reset?.();
      } catch (_) {}
      scannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  /* ── LIMPIAR AL CERRAR ── */
  useEffect(() => {
    if (!isOpen) {
      detenerCamara();
      setSeriales([]);
      serialesRef.current = [];
      setManualInput("");
      setCamError(null);
      lastScanRef.current = { serial: "", time: 0 };
    }
  }, [isOpen, detenerCamara]);

  useEffect(() => {
    if (isOpen && !scanning) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, scanning]);

  const handleManualKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      agregarSerial(manualInput);
      setManualInput("");
    }
  };

  const eliminarSerial = (id: string) =>
    setSeriales((prev) => prev.filter((s) => s.id !== id));

  const handleConfirmar = () => {
    onConfirm(seriales.map((s) => s.serial));
    onClose();
  };

  if (!isOpen) return null;

  const flashClass =
    flashScan === "ok"
      ? styles.flashGreen
      : flashScan === "dup"
        ? styles.flashRed
        : "";

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        {/* HEADER */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <rect x="1" y="1" width="5" height="5" rx="1" />
                <rect x="10" y="1" width="5" height="5" rx="1" />
                <rect x="1" y="10" width="5" height="5" rx="1" />
                <path d="M10 10h2v2h-2zM12 12h3M12 10h3M10 12v3" />
              </svg>
            </span>
            <div>
              <h3 className={styles.modalTitle}>Escanear seriales</h3>
              <p className={styles.modalSub}>
                {seriales.length === 0
                  ? "Sin seriales escaneados"
                  : `${seriales.length} serial${seriales.length !== 1 ? "es" : ""} en lista`}
              </p>
            </div>
          </div>
          <button className={styles.btnClose} onClick={onClose} type="button">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        {/* CÁMARA */}
        <div className={`${styles.cameraSection} ${flashClass}`}>
          {!scanning && !camError && (
            <div className={styles.cameraPlaceholder}>
              <svg
                width="36"
                height="36"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path d="M6 14V9a2 2 0 0 1 2-2h4M30 7h4a2 2 0 0 1 2 2v5M36 26v5a2 2 0 0 1-2 2h-4M10 33H6a2 2 0 0 1-2-2v-5" />
                <circle cx="20" cy="20" r="5" />
              </svg>
              <p>Apunta al código de barras y activa la cámara</p>
              <button
                type="button"
                className={styles.btnStartCam}
                onClick={() => iniciarCamara()}
              >
                Activar cámara
              </button>
            </div>
          )}

          {camError && (
            <div className={styles.camError}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              >
                <circle cx="10" cy="10" r="8" />
                <line x1="10" y1="6" x2="10" y2="11" />
                <circle cx="10" cy="14" r=".5" fill="currentColor" />
              </svg>
              <p>{camError}</p>
              <button
                type="button"
                className={styles.btnStartCam}
                onClick={() => iniciarCamara()}
              >
                Reintentar
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className={`${styles.video} ${scanning ? styles.videoVisible : ""}`}
            playsInline
            muted
          />

          {scanning && (
            <>
              <div className={styles.scanOverlay}>
                <div className={styles.cornerTL} />
                <div className={styles.cornerTR} />
                <div className={styles.cornerBL} />
                <div className={styles.cornerBR} />
                <div className={styles.scanLine} />
                <p className={styles.scanHint}>
                  Centra el código en el recuadro
                </p>
              </div>

              <div className={styles.camControls}>
                {/* Selector de cámara — solo si hay más de una */}
                {camaras.length > 1 && (
                  <div className={styles.camSelectorWrap}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    >
                      <path d="M1 6l4-4 4 4M15 10l-4 4-4-4" />
                    </svg>
                    <select
                      className={styles.camSelector}
                      value={camaraActual ?? ""}
                      onChange={(e) => cambiarCamara(e.target.value)}
                    >
                      {camaras.map((c, i) => (
                        <option key={c.deviceId} value={c.deviceId}>
                          {c.label.length > 22 ? `Cámara ${i + 1}` : c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Linterna */}
                {torchAvailable && (
                  <button
                    type="button"
                    className={`${styles.btnTorch} ${torchOn ? styles.btnTorchOn : ""}`}
                    onClick={toggleTorch}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill={torchOn ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 2h6l-1 7h-4L9 2z" />
                      <path d="M10 9l-3 13h10L14 9" />
                      <line x1="12" y1="13" x2="12" y2="17" />
                    </svg>
                    {torchOn ? "Linterna ON" : "Linterna"}
                  </button>
                )}

                <button
                  type="button"
                  className={styles.btnStopCam}
                  onClick={detenerCamara}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                  >
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                  </svg>
                  Detener
                </button>
              </div>
            </>
          )}
        </div>

        {/* INPUT MANUAL */}
        <div className={styles.manualSection}>
          <div className={styles.manualBar}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            >
              <rect x="1" y="3" width="10" height="7" rx="1" />
              <path d="M4 3V2M8 3V2M1 6h10" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.manualInput}
              placeholder="Escribir serial y presionar Enter..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              onKeyDown={handleManualKeyDown}
            />
            {manualInput && (
              <button
                type="button"
                className={styles.btnAddManual}
                onClick={() => {
                  agregarSerial(manualInput);
                  setManualInput("");
                }}
              >
                Agregar
              </button>
            )}
          </div>
        </div>

        {/* LISTA */}
        <div className={styles.serialList}>
          {seriales.length === 0 ? (
            <div className={styles.emptyList}>
              <p>Los seriales aparecerán aquí</p>
            </div>
          ) : (
            seriales.map((item) => (
              <div key={item.id} className={styles.serialItem}>
                <div className={styles.serialLeft}>
                  <span className={styles.serialDot} />
                  <span className={styles.serialCode}>{item.serial}</span>
                </div>
                <div className={styles.serialRight}>
                  <span className={styles.serialTime}>{item.timestamp}</span>
                  <button
                    type="button"
                    className={styles.btnRemove}
                    onClick={() => eliminarSerial(item.id)}
                  >
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    >
                      <line x1="1.5" y1="1.5" x2="9.5" y2="9.5" />
                      <line x1="9.5" y1="1.5" x2="1.5" y2="9.5" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnCancelar}
            onClick={onClose}
          >
            Cancelar
          </button>
          <div className={styles.footerRight}>
            {seriales.length > 0 && (
              <button
                type="button"
                className={styles.btnLimpiar}
                onClick={() => {
                  setSeriales([]);
                  serialesRef.current = [];
                }}
              >
                Limpiar todo
              </button>
            )}
            <button
              type="button"
              className={styles.btnConfirmar}
              disabled={seriales.length === 0}
              onClick={handleConfirmar}
            >
              Confirmar {seriales.length > 0 ? `(${seriales.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

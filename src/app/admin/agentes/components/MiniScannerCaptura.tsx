"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Props {
  isOpen: boolean;
  onCapturar: (codigo: string) => void;
  onClose: () => void;
}

interface ScanRect { top: number; left: number; bottom: number; right: number; }
interface Camara   { deviceId: string; label: string; }
type Handle = "tl" | "tr" | "bl" | "br" | "t" | "b" | "l" | "r";
type Estado = "idle" | "ok" | "error";

const RECT_INIT: ScanRect = { top: 30, left: 5, bottom: 70, right: 95 };
const MIN_SIZE = 8;
const HANDLE_IDS: Handle[] = ["tl", "tr", "bl", "br", "t", "b", "l", "r"];

// ── BarcodeDetector nativo ────────────────────────────────────────────────
declare const BarcodeDetector: {
  new(opts: { formats: string[] }): {
    detect(src: CanvasImageSource | HTMLVideoElement): Promise<{ rawValue: string; boundingBox?: DOMRectReadOnly }[]>;
  };
  getSupportedFormats(): Promise<string[]>;
};
let nativeDetector: InstanceType<typeof BarcodeDetector> | null = null;
let nativeChecked = false;

async function getDetector() {
  if (nativeChecked) return nativeDetector;
  nativeChecked = true;
  if (typeof window === "undefined" || !("BarcodeDetector" in window)) return null;
  try {
    const supported = await BarcodeDetector.getSupportedFormats();
    const want = ["code_128", "code_39", "ean_13", "ean_8", "qr_code", "data_matrix", "itf", "codabar"];
    nativeDetector = new BarcodeDetector({ formats: want.filter((f) => supported.includes(f)) });
  } catch { nativeDetector = null; }
  return nativeDetector;
}

// ── Canvas overlay helper ─────────────────────────────────────────────────
function drawOverlay(canvas: HTMLCanvasElement, r: ScanRect, estado: Estado) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  const x  = r.left   / 100 * w, y  = r.top    / 100 * h;
  const rw = (r.right - r.left) / 100 * w;
  const rh = (r.bottom - r.top) / 100 * h;

  ctx.clearRect(0, 0, w, h);

  // Zona oscura fuera del recuadro
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, w, h);
  ctx.clearRect(x, y, rw, rh);

  // Borde del recuadro
  ctx.strokeStyle = estado === "ok" ? "#22c55e" : estado === "error" ? "#ef4444" : "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, rw, rh);

  // Esquinas de guía
  const cs = Math.min(22, rw * 0.15, rh * 0.15);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + cs, y);        ctx.lineTo(x, y);        ctx.lineTo(x, y + cs);
  ctx.moveTo(x + rw - cs, y);   ctx.lineTo(x + rw, y);   ctx.lineTo(x + rw, y + cs);
  ctx.moveTo(x, y + rh - cs);   ctx.lineTo(x, y + rh);   ctx.lineTo(x + cs, y + rh);
  ctx.moveTo(x + rw - cs, y + rh); ctx.lineTo(x + rw, y + rh); ctx.lineTo(x + rw, y + rh - cs);
  ctx.stroke();
}

// Posición de cada handle en el recuadro (% del contenedor)
function handlePos(id: Handle, r: ScanRect): [number, number] {
  const mx = (r.left + r.right) / 2, my = (r.top + r.bottom) / 2;
  switch (id) {
    case "tl": return [r.left, r.top];    case "tr": return [r.right, r.top];
    case "bl": return [r.left, r.bottom]; case "br": return [r.right, r.bottom];
    case "t":  return [mx, r.top];        case "b":  return [mx, r.bottom];
    case "l":  return [r.left, my];       case "r":  return [r.right, my];
  }
}

// Aplicar delta de arrastre a un handle
function applyDrag(h: Handle, dx: number, dy: number, s: ScanRect): ScanRect {
  const r = { ...s };
  if (h === "tl" || h === "t" || h === "l") {
    if (h !== "l") r.top  = Math.max(0,   Math.min(r.bottom - MIN_SIZE, r.top  + dy));
    if (h !== "t") r.left = Math.max(0,   Math.min(r.right  - MIN_SIZE, r.left + dx));
  }
  if (h === "tr" || h === "t" || h === "r") {
    if (h !== "r") r.top   = Math.max(0,   Math.min(r.bottom - MIN_SIZE, r.top   + dy));
    if (h !== "t") r.right = Math.max(r.left + MIN_SIZE, Math.min(100,   r.right + dx));
  }
  if (h === "bl" || h === "b" || h === "l") {
    if (h !== "l") r.bottom = Math.max(r.top  + MIN_SIZE, Math.min(100, r.bottom + dy));
    if (h !== "b") r.left   = Math.max(0,     Math.min(r.right - MIN_SIZE, r.left + dx));
  }
  if (h === "br" || h === "b" || h === "r") {
    if (h !== "r") r.bottom = Math.max(r.top  + MIN_SIZE, Math.min(100, r.bottom + dy));
    if (h !== "b") r.right  = Math.max(r.left + MIN_SIZE, Math.min(100, r.right  + dx));
  }
  return r;
}

export default function MiniScannerCaptura({ isOpen, onCapturar, onClose }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef       = useRef<number>(0);

  // Rect y estado como refs para el canvas loop (sin pasar por React)
  const rectRef   = useRef<ScanRect>({ ...RECT_INIT });
  const estadoRef = useRef<Estado>("idle");

  // Refs de los handles para moverlos sin re-render
  const handleRefs = useRef<Partial<Record<Handle, HTMLDivElement>>>({});

  const dragRef = useRef<{ handle: Handle; startX: number; startY: number; startRect: ScanRect } | null>(null);
  const scanningRef = useRef(false);

  const [listo, setListo]       = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [camaras, setCamaras]   = useState<Camara[]>([]);
  const [camaraId, setCamaraId] = useState<string>("");
  const [torchOn, setTorchOn]   = useState(false);
  const [torchAvail, setTorchAvail] = useState(false);
  const [usaNativo, setUsaNativo]   = useState(false);
  // Estado visible en UI — también se escribe en estadoRef para el canvas
  const [estado, setEstadoUI]   = useState<Estado>("idle");
  const [resultado, setResultado] = useState<string | null>(null);

  const setEstado = useCallback((e: Estado) => {
    estadoRef.current = e;
    setEstadoUI(e);
  }, []);

  // ── Canvas overlay loop (rAF, sin React) ─────────────────────────────────
  useEffect(() => {
    if (!isOpen) { cancelAnimationFrame(rafRef.current); return; }

    const loop = () => {
      const canvas = overlayRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const w = container.clientWidth, h = container.clientHeight;
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        drawOverlay(canvas, rectRef.current, estadoRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isOpen]);

  // Mover handles en el DOM sin setState
  const syncHandles = useCallback((r: ScanRect) => {
    HANDLE_IDS.forEach((id) => {
      const el = handleRefs.current[id];
      if (!el) return;
      const [left, top] = handlePos(id, r);
      el.style.left = `${left}%`;
      el.style.top  = `${top}%`;
    });
  }, []);

  const stopScan = useCallback(() => {
    if (scanTimerRef.current) { clearInterval(scanTimerRef.current); scanTimerRef.current = null; }
    scanningRef.current = false;
  }, []);

  const detener = useCallback(() => {
    stopScan();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopScan]);

  const startScan = useCallback((det: InstanceType<typeof BarcodeDetector> | null) => {
    stopScan();
    const interval = det ? 150 : 400;

    scanTimerRef.current = setInterval(async () => {
      if (scanningRef.current || estadoRef.current !== "idle") return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      scanningRef.current = true;
      try {
        if (det) {
          const all = await det.detect(video);
          if (all.length > 0) {
            // Filtrar por posición dentro del recuadro
            const r  = rectRef.current;
            const container = containerRef.current;
            const dw = container?.clientWidth  ?? video.clientWidth;
            const dh = container?.clientHeight ?? video.clientHeight;
            const vw = video.videoWidth, vh = video.videoHeight;
            const scale = Math.max(dw / vw, dh / vh);
            const offX  = (dw - vw * scale) / 2;
            const offY  = (dh - vh * scale) / 2;

            const inRect = all.filter((b) => {
              if (!b.boundingBox) return true;
              const cx = b.boundingBox.x + b.boundingBox.width  / 2;
              const cy = b.boundingBox.y + b.boundingBox.height / 2;
              const dx = (cx * scale + offX) / dw * 100;
              const dy = (cy * scale + offY) / dh * 100;
              return dx >= r.left && dx <= r.right && dy >= r.top && dy <= r.bottom;
            });

            if (inRect.length > 0) {
              setResultado(inRect[0].rawValue.trim());
              setEstado("ok");
            }
          }
        } else {
          // ZXing fallback — crop canvas → worker
          const container = containerRef.current;
          if (!container) return;
          const r  = rectRef.current;
          const vw = video.videoWidth, vh = video.videoHeight;
          const dw = container.clientWidth,  dh = container.clientHeight;
          const scale = Math.max(dw / vw, dh / vh);
          const offX  = (dw - vw * scale) / 2, offY = (dh - vh * scale) / 2;
          const cx = Math.max(0, ((r.left / 100) * dw - offX) / scale);
          const cy = Math.max(0, ((r.top  / 100) * dh - offY) / scale);
          const cw = Math.min(((r.right - r.left) / 100) * dw / scale, vw - cx);
          const ch = Math.min(((r.bottom - r.top)  / 100) * dh / scale, vh - cy);
          if (cw < 20 || ch < 20) return;
          const ds = Math.min(1, 900 / Math.max(cw, ch));
          const c = document.createElement("canvas");
          c.width = Math.round(cw * ds); c.height = Math.round(ch * ds);
          c.getContext("2d")!.drawImage(video, cx, cy, cw, ch, 0, 0, c.width, c.height);
          const img = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
          await new Promise<void>((resolve) => {
            const w = new Worker(new URL("../workers/barcodeWorker.ts", import.meta.url));
            w.onmessage = (e: MessageEvent<{ text: string | null }>) => {
              w.terminate();
              const t = e.data.text?.trim();
              if (t) { setResultado(t); setEstado("ok"); }
              resolve();
            };
            w.postMessage({ pixels: img.data, width: img.width, height: img.height }, [img.data.buffer]);
          });
        }
      } catch { /* sin código en frame */ }
      scanningRef.current = false;
    }, interval);
  }, [stopScan, setEstado]);

  const iniciar = useCallback(async (deviceId?: string) => {
    detener();
    setCamError(null); setListo(false); setEstado("idle"); setResultado(null);
    setTorchOn(false); setTorchAvail(false);
    rectRef.current = { ...RECT_INIT };
    syncHandles(RECT_INIT);

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCamaras(videoDevices.map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Cámara ${i + 1}` })));

      // Usar la cámara guardada, la pasada por parámetro, o la posición 3 (principal trasera típica)
      const savedId  = localStorage.getItem("miniScanner_camaraId");
      const targetId = deviceId ?? savedId ?? videoDevices[3]?.deviceId ?? videoDevices[0]?.deviceId;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: targetId
          ? { deviceId: { exact: targetId }, width: { ideal: 9999 }, height: { ideal: 9999 } }
          : { facingMode: "environment", width: { ideal: 9999 }, height: { ideal: 9999 } },
      });
      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      if (track) {
        // Leer resolución máxima real del sensor y aplicarla
        const caps = track.getCapabilities() as Record<string, { max?: number } | boolean>;
        const maxW = (caps.width as { max?: number })?.max;
        const maxH = (caps.height as { max?: number })?.max;
        if (maxW && maxH) {
          try { await track.applyConstraints({ width: maxW, height: maxH }); } catch { /* ok */ }
        }
        if (caps.torch) setTorchAvail(true);
        try { await track.applyConstraints({ advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet] }); } catch { /* ok */ }
        const s = track.getSettings();
        if (s.deviceId) setCamaraId(s.deviceId);
      }

      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setListo(true);

      const det = await getDetector();
      setUsaNativo(!!det);
      startScan(det);
    } catch (err: unknown) {
      const e = err as { name?: string };
      setCamError(e?.name === "NotAllowedError" ? "Permiso de cámara denegado"
        : e?.name === "NotFoundError" ? "No se encontró cámara" : "Error al iniciar la cámara");
    }
  }, [detener, startScan, setEstado, syncHandles]);

  useEffect(() => {
    if (isOpen) { iniciar(); }
    else {
      detener(); cancelAnimationFrame(rafRef.current);
      setListo(false); setCamError(null); setEstado("idle"); setResultado(null); setTorchOn(false);
      rectRef.current = { ...RECT_INIT };
    }
  }, [isOpen, iniciar, detener, setEstado]);

  // Toque para enfocar
  const handleTapFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (estado !== "idle") return;
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const el = containerRef.current!.getBoundingClientRect();
    const cx = "touches" in e ? e.touches[0]?.clientX ?? 0 : e.clientX;
    const cy = "touches" in e ? e.touches[0]?.clientY ?? 0 : e.clientY;
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: "single-shot", pointOfInterest: { x: (cx - el.left) / el.width, y: (cy - el.top) / el.height } } as MediaTrackConstraintSet],
      });
    } catch { /* no soportado */ }
  };

  const handleConfirmar = () => { if (resultado) { onCapturar(resultado); onClose(); } };
  const handleReintentar = () => { setEstado("idle"); setResultado(null); };

  const toggleTorch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try { await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }); setTorchOn(next); } catch { /* ok */ }
  };

  // ── Drag handles — todo en refs, sin setState durante el arrastre ─────────
  const startDrag = useCallback((handle: Handle, clientX: number, clientY: number) => {
    dragRef.current = { handle, startX: clientX, startY: clientY, startRect: { ...rectRef.current } };

    const onMove = (clientX2: number, clientY2: number) => {
      if (!dragRef.current || !containerRef.current) return;
      const b = containerRef.current.getBoundingClientRect();
      const dx = ((clientX2 - dragRef.current.startX) / b.width)  * 100;
      const dy = ((clientY2 - dragRef.current.startY) / b.height) * 100;
      const nr = applyDrag(dragRef.current.handle, dx, dy, dragRef.current.startRect);
      rectRef.current = nr;  // canvas loop lo leerá en el próximo frame
      syncHandles(nr);       // mover handles directamente en el DOM
    };

    const onMouseMove = (ev: MouseEvent) => onMove(ev.clientX, ev.clientY);
    const onTouchMove = (ev: TouchEvent) => { ev.preventDefault(); onMove(ev.touches[0].clientX, ev.touches[0].clientY); };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
  }, [syncHandles]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000", overflow: "hidden", touchAction: "none" }}
      onClick={handleTapFocus}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Video fullscreen */}
      <video ref={videoRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: listo ? "block" : "none" }}
        playsInline muted />

      {/* Canvas overlay — dibujado fuera de React */}
      <canvas ref={overlayRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

      {/* Iniciando */}
      {!listo && !camError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 12 }}>Iniciando cámara…</p>
        </div>
      )}

      {/* Error */}
      {camError && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <p style={{ color: "#f87171", fontSize: 14, textAlign: "center", padding: "0 32px" }}>{camError}</p>
          <button type="button" onClick={(e) => { e.stopPropagation(); iniciar(camaraId || undefined); }}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Handles de arrastre — posición inicial, luego movidos por DOM directo */}
      {listo && estado === "idle" && HANDLE_IDS.map((id) => {
        const [left, top] = handlePos(id, RECT_INIT);
        const cursor = id === "tl" || id === "br" ? "nwse-resize"
                     : id === "tr" || id === "bl" ? "nesw-resize"
                     : id === "t"  || id === "b"  ? "ns-resize" : "ew-resize";
        return (
          <div key={id}
            ref={(el) => { if (el) handleRefs.current[id] = el; }}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag(id, e.clientX, e.clientY); }}
            onTouchStart={(e) => { e.stopPropagation(); startDrag(id, e.touches[0].clientX, e.touches[0].clientY); }}
            style={{
              position: "absolute", width: 24, height: 24,
              left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)",
              background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(0,0,0,0.3)",
              borderRadius: 5, zIndex: 20, touchAction: "none", cursor,
            }}
          />
        );
      })}

      {/* Barra superior */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)", zIndex: 30 }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ width: 38, height: 38, background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 10, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>
        <span style={{ fontSize: 10, color: usaNativo ? "#4ade80" : "#fbbf24", background: "rgba(0,0,0,0.45)", borderRadius: 5, padding: "3px 8px" }}>
          {usaNativo ? "⚡ Nativo" : "ZXing"}
        </span>
        {torchAvail ? (
          <button type="button" onClick={toggleTorch}
            style={{ width: 38, height: 38, background: torchOn ? "#facc15" : "rgba(0,0,0,0.45)", border: "none", borderRadius: 10, color: torchOn ? "#1e293b" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IcoTorch />
          </button>
        ) : <div style={{ width: 38 }} />}
      </div>

      {/* Hint */}
      {listo && estado === "idle" && (
        <div style={{ position: "absolute", top: `${RECT_INIT.bottom + 2}%`, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 25 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Toca para enfocar · Arrastra el recuadro</span>
        </div>
      )}

      {/* Selector de cámara */}
      {camaras.length > 1 && (
        <div style={{ position: "absolute", bottom: 145, left: 16, right: 16, display: "flex", alignItems: "center", gap: 8, zIndex: 30 }}>
          <IcoCamara />
          <select value={camaraId} onChange={(e) => { e.stopPropagation(); const id = e.target.value; localStorage.setItem("miniScanner_camaraId", id); setCamaraId(id); iniciar(id); }}
            style={{ flex: 1, height: 34, background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, fontSize: 12, padding: "0 10px", cursor: "pointer", outline: "none" }}>
            {camaras.map((c) => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
          </select>
        </div>
      )}

      {/* Barra inferior */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 28px", background: "linear-gradient(to top, rgba(0,0,0,0.75) 70%, transparent)", display: "flex", flexDirection: "column", gap: 10, zIndex: 30 }}>
        <div style={{ minHeight: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {estado === "idle" && listo && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
              Centra el código de barras dentro del recuadro
            </span>
          )}
          {estado === "ok" && resultado && (
            <span style={{ fontFamily: "'Courier New', monospace", fontSize: 20, fontWeight: 700, color: "#4ade80", letterSpacing: "0.06em", textAlign: "center", wordBreak: "break-all" }}>
              {resultado}
            </span>
          )}
          {estado === "error" && (
            <span style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>
              No se encontró — ajusta el recuadro e intenta de nuevo
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {(estado === "ok" || estado === "error") && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleReintentar(); }}
              style={{ flex: 1, height: 52, background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Reintentar
            </button>
          )}
          {estado === "ok" ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleConfirmar(); }}
              style={{ flex: 2, height: 52, background: "#16a34a", color: "#fff", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Confirmar ✓
            </button>
          ) : (
            <div style={{ flex: 1, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" style={{ animation: listo ? "spin 1.2s linear infinite" : "none" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>
                {listo ? "Escaneando…" : "Iniciando…"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IcoTorch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 2l-1 6H5l7 14 7-14h-3L15 2H9zm1.5 2h3l.75 4.5H10.25L10.5 4z" />
    </svg>
  );
}

function IcoCamara() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

import React, { useState, useEffect } from "react";
import styles from "../css/prealerta.module.css";
import {
  AccesorioAgrupado,
  PropsSincronizarAccesorios,
} from "@/app/models/Accesorios.models";

const WFSM_LOGIN_URL = process.env.WFSM_LOGIN_URL!;
const WFSM_CONSULTA_ACCESORIOS_URL = process.env.WFSM_CONSULTA_ACCESORIOS_URL!;
const WFSM_AUTH_BASIC = process.env.WFSM_AUTH_BASIC!;

export default function SincronizarAccesoriosModal({
  isOpen,
  onClose,
  onConfirm,
  sincronizando,
}: PropsSincronizarAccesorios) {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });

  const [cedula, setCedula] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [buscando, setBuscando] = useState(false);
  const [accesorios, setAccesorios] = useState<AccesorioAgrupado[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    setFecha(hoy);
    setBuscado(false);
    setAccesorios([]);
    setError("");
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) {
        const u = JSON.parse(raw);
        const doc =
          u.documento_identidad ??
          u.cedula ??
          u.numeroDocumento ??
          u.documento ??
          "";
        setCedula(String(doc));
      }
    } catch (_) {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuscar = async () => {
    if (!cedula.trim()) {
      setError("Ingresa un número de cédula");
      return;
    }
    setError("");
    setBuscando(true);
    setAccesorios([]);
    setBuscado(false);

    try {
      const loginRes = await fetch(WFSM_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: WFSM_AUTH_BASIC,
        },
      });
      if (!loginRes.ok) throw new Error(`Login fallido: ${loginRes.status}`);
      const { token } = await loginRes.json();
      if (!token) throw new Error("Token no recibido");

      const params = new URLSearchParams({
        min_fecha: `${fecha}T00:00:00.000Z`,
        max_fecha: `${fecha}T23:59:59.000Z`,
        "conf/timezone": "300",
        "servicio/id_proyecto": "1",
      });

      const consultaRes = await fetch(
        `${WFSM_CONSULTA_ACCESORIOS_URL}?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${token}`,
          },
        },
      );
      if (!consultaRes.ok)
        throw new Error(`Consulta fallida: ${consultaRes.status}`);

      const data = await consultaRes.json();
      const registros: Array<Record<string, unknown>> = data?.registros ?? [];

      const filtrados = registros.filter(
        (r) => String(r.documento_identidad ?? "").trim() === cedula.trim(),
      );

      if (filtrados.length === 0) {
        setBuscado(true);
        setAccesorios([]);
        return;
      }

      const mapa = new Map<string, AccesorioAgrupado>();
      for (const r of filtrados) {
        const codigo = String(r.codigo_accesorio ?? "").trim();
        const nombre = String(r.accesorio ?? "").trim();
        if (!codigo) continue;
        const key = `${codigo}||${nombre}`;
        if (mapa.has(key)) {
          mapa.get(key)!.cantidad += 1;
        } else {
          mapa.set(key, {
            codigoAccesorio: codigo,
            accesorio: nombre,
            cantidad: 1,
          });
        }
      }

      setAccesorios(Array.from(mapa.values()));
      setBuscado(true);
    } catch (err) {
      console.error(err);
      setError("Error al consultar la API");
    } finally {
      setBuscando(false);
    }
  };

  const handleConfirmar = () => {
    if (accesorios.length === 0) return;
    onConfirm(accesorios); // ← pasa los nuevos al padre
    onClose();
  };
  const total = accesorios.reduce((s, a) => s + a.cantidad, 0);

  return (
    <div className={styles.confirmOverlay} onClick={onClose}>
      <div
        className={styles.confirmBox}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          maxHeight: "90vh", // ← altura máxima
          overflowY: "auto", // ← scroll vertical
          overflowX: "hidden",
        }}
      >
        {/* Ícono */}
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

        <p className={styles.confirmTitle}>Sincronizar Accesorios</p>
        <p className={styles.confirmSub}>
          Ingresa tu documento para traer solo tus accesorios
        </p>

        {/* Fecha */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <label style={labelStyle}>Fecha proceso</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setBuscado(false);
              setAccesorios([]);
            }}
            style={inputStyle(false)}
          />
        </div>

        {/* Cédula */}
        <div style={{ width: "100%", marginTop: 10 }}>
          <label style={labelStyle}>Documento de identidad</label>
          <input
            type="text"
            placeholder="Ej: 18399885"
            value={cedula}
            onChange={(e) => {
              setCedula(e.target.value);
              setBuscado(false);
              setAccesorios([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
            autoFocus
            style={inputStyle(!!cedula)}
          />
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              color: "#e53e3e",
              fontSize: 11,
              marginTop: 6,
              alignSelf: "flex-start",
            }}
          >
            {error}
          </p>
        )}

        {/* Botón buscar */}
        <button
          type="button"
          onClick={handleBuscar}
          disabled={buscando}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "8px 0",
            borderRadius: 8,
            border: "none",
            background: buscando ? "#94a3b8" : "#f1f5f9",
            color: "#334155",
            fontSize: 12,
            fontWeight: 600,
            cursor: buscando ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {buscando ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animation: "spin 0.8s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Buscando…
            </>
          ) : (
            "Buscar"
          )}
        </button>

        {/* Tabla resultados */}
        {buscado && (
          <div style={{ width: "100%", marginTop: 12 }}>
            {accesorios.length === 0 ? (
              <p
                style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}
              >
                Sin accesorios para esa cédula en la fecha seleccionada.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "5px 6px",
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      Material
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "5px 6px",
                        color: "#94a3b8",
                        fontWeight: 500,
                      }}
                    >
                      Cant.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accesorios.map((a) => (
                    <tr
                      key={a.codigoAccesorio}
                      style={{ borderBottom: "1px solid #f8fafc" }}
                    >
                      <td style={{ padding: "5px 6px", color: "#1e293b" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "'Courier New', monospace",
                          }}
                        >
                          {a.codigoAccesorio}
                        </span>
                        <span style={{ color: "#64748b", marginLeft: 6 }}>
                          {a.accesorio}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          padding: "5px 6px",
                          fontWeight: 700,
                          color: "#2563eb",
                        }}
                      >
                        {a.cantidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td
                      style={{
                        padding: "5px 6px",
                        fontWeight: 600,
                        color: "#475569",
                        fontSize: 11,
                      }}
                    >
                      Total unidades
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "5px 6px",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* Botones acción */}
        <div className={styles.confirmBtns}>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={onClose}
            disabled={sincronizando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={handleConfirmar}
            disabled={accesorios.length === 0 || sincronizando}
            style={{
              background: accesorios.length > 0 ? "#2563eb" : "#94a3b8",
              cursor: accesorios.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            {sincronizando ? "Cargando…" : `Cargar ${total || ""} unidades`}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#94a3b8",
};

const inputStyle = (active: boolean): React.CSSProperties => ({
  width: "100%",
  marginTop: 4,
  padding: "7px 10px",
  border: `0.5px solid ${active ? "#2563eb" : "#e2e8f0"}`,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'Courier New', monospace",
  fontWeight: 600,
  outline: "none",
  boxSizing: "border-box",
  color: "#1e293b",
  background: "#f8fafc",
  boxShadow: active ? "0 0 0 2px rgba(37,99,235,0.08)" : "none",
});

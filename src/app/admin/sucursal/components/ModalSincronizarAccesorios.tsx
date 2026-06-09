"use client";

import React from "react";
import styles from "../css/SincronizarAccesoriosModal.module.css";
import { PropsSincronizarAccesorios } from "@/app/models/Accesorios.models";
import { useSincronizarAccesorios } from "../hooks/useSincronizarAccesorios";

export default function SincronizarAccesoriosModal({
  isOpen,
  onClose,
  onConfirm,
  sincronizando,
}: PropsSincronizarAccesorios) {
  const {
    cedula,
    setCedula,
    fecha,
    setFecha,
    buscando,
    accesorios,
    buscado,
    setBuscado,
    setAccesorios,
    error,
    total,
    buscar,
  } = useSincronizarAccesorios(isOpen);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (accesorios.length === 0) return;
    onConfirm(accesorios);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={(e) => e.stopPropagation()}>
        <svg
          className={styles.icon}
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

        <p className={styles.title}>Sincronizar Accesorios</p>
        <p className={styles.subtitle}>
          Ingresa tu documento para traer solo tus accesorios
        </p>

        {/* Fecha */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Fecha proceso</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setBuscado(false);
              setAccesorios([]);
            }}
            className={styles.input}
          />
        </div>

        {/* Cédula */}
        <div className={styles.fieldGroup} style={{ marginTop: 10 }}>
          <label className={styles.label}>Documento de identidad</label>
          <input
            type="text"
            placeholder="Ej: 18399885"
            value={cedula}
            onChange={(e) => {
              setCedula(e.target.value);
              setBuscado(false);
              setAccesorios([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            autoFocus
            className={`${styles.input} ${cedula ? styles.inputActive : ""}`}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* Botón buscar */}
        <button
          type="button"
          onClick={buscar}
          disabled={buscando}
          className={styles.btnBuscar}
        >
          {buscando ? (
            <>
              <svg
                className={styles.spinner}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Buscando…
            </>
          ) : (
            "Buscar"
          )}
        </button>

        {/* Resultados */}
        {buscado && (
          <div className={styles.resultados}>
            {accesorios.length === 0 ? (
              <p className={styles.vacio}>
                Sin accesorios para esa cédula en la fecha seleccionada.
              </p>
            ) : (
              <table className={styles.tabla}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th className={styles.thMaterial}>Material</th>
                    <th className={styles.thCantidad}>Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {accesorios.map((a) => (
                    <tr key={a.codigoAccesorio} className={styles.trBody}>
                      <td className={styles.tdMaterial}>
                        <span className={styles.codigo}>
                          {a.codigoAccesorio}
                        </span>
                        <span className={styles.nombre}>{a.accesorio}</span>
                      </td>
                      <td className={styles.tdCantidad}>{a.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid #e2e8f0" }}>
                    <td className={styles.tfootTd}>Total unidades</td>
                    <td className={styles.tfootTotal}>{total}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}

        {/* Botones */}
        <div className={styles.btns}>
          <button
            type="button"
            className={styles.btnCancelar}
            onClick={onClose}
            disabled={sincronizando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnCargar}
            onClick={handleConfirmar}
            disabled={accesorios.length === 0 || sincronizando}
          >
            {sincronizando ? "Cargando…" : `Cargar ${total || ""} unidades`}
          </button>
        </div>
      </div>
    </div>
  );
}

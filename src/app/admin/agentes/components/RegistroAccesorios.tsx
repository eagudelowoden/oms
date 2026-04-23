"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "../css/registroSeries.module.css";
import { prealertaQueries } from "@/app/services/agente.client";
import { SerialItem } from "@/app/models/seriales.models";

interface Props {
  onAgregarAccesorio: (item: SerialItem) => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
}

export default function RegistroAccesorios({ onAgregarAccesorio, onShowToast }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionado, setSeleccionado] = useState<{ codigo: string; descripcion: string } | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [abierto, setAbierto] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: codigos = [] } = useQuery({
    queryKey: ["codigosSap"],
    queryFn: prealertaQueries.codigosSap,
    staleTime: 5 * 60 * 1000,
  });

  const filtrados = busqueda.trim()
    ? codigos
        .filter((c) =>
          `${c.codigo} ${c.descripcion}`.toLowerCase().includes(busqueda.toLowerCase()),
        )
        .slice(0, 60)
    : codigos.slice(0, 60);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSeleccionar = (item: { codigo: string; descripcion: string }) => {
    setSeleccionado(item);
    setBusqueda(`${item.codigo} – ${item.descripcion}`);
    setAbierto(false);
  };

  const handleAgregar = () => {
    if (!seleccionado) {
      onShowToast("Selecciona un accesorio primero", "error");
      return;
    }
    onAgregarAccesorio({
      codigo: seleccionado.codigo,
      descripcion: seleccionado.descripcion,
      codigo_sap: seleccionado.codigo,
      cantidad,
      origen: "api" as const,
      tipo: "No-serializable" as const,
      tramite: "Manual",
    });
    setSeleccionado(null);
    setBusqueda("");
    setCantidad(1);
    onShowToast(`✓ ${seleccionado.codigo} agregado (x${cantidad})`);
  };

  return (
    <div className={styles.registroCard}>
      <div className={styles.cardInnerHeader}>
        <span className={styles.cardInnerTitle}>Registro Accesorios</span>
      </div>

      <div className={styles.registroBody}>
        {/* Familia Acc — buscador */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Familia Acc</label>
          <div className={styles.comboWrap} ref={wrapperRef}>
            <input
              className={styles.registroInput}
              placeholder="Buscar código o descripción…"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setSeleccionado(null);
                setAbierto(true);
              }}
              onFocus={() => setAbierto(true)}
              autoComplete="off"
            />
            {abierto && filtrados.length > 0 && (
              <div className={styles.comboDropdown}>
                {filtrados.map((item) => (
                  <button
                    key={item.codigo}
                    type="button"
                    className={styles.comboOption}
                    onMouseDown={() => handleSeleccionar(item)}
                  >
                    <span className={styles.comboCodigo}>{item.codigo}</span>
                    <span className={styles.comboDesc}>{item.descripcion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cantidad */}
        <div className={styles.registroRow}>
          <label className={styles.registroLabel}>Cant</label>
          <input
            type="number"
            className={styles.registroInput}
            value={cantidad}
            min={1}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
            style={{ width: 80, flex: "none" }}
          />
        </div>

        <button type="button" className={styles.btnGuardar} onClick={handleAgregar}>
          Agregar
        </button>
      </div>
    </div>
  );
}

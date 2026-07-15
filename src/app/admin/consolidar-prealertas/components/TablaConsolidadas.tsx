"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import styles from "../css/consolidar-prealertas.module.css";
import { PrealertaConsolidadaRow } from "@/app/services/consolidar-prealertas.service";
import { consolidarQueries } from "@/app/services/consolidar-prealertas.client";

interface Props {
  consolidadas: PrealertaConsolidadaRow[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TablaConsolidadas({ consolidadas, isLoading, onRefresh }: Props) {
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const handleDescargar = async (c: PrealertaConsolidadaRow) => {
    setDescargandoId(c.id);
    try {
      const seriales = await consolidarQueries.serialesDescarga(c.id);
      if (seriales.length === 0) {
        alert("Esta prealerta no tiene seriales para descargar");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(seriales, {
        header: ["Serial", "Mac", "CodigoSap", "Descripcion", "Caja", "Cantidad", "Tipo"],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Prealerta");
      XLSX.writeFile(wb, `${c.nombre || `Prealerta-${c.id}`}.xlsx`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar el archivo");
    } finally {
      setDescargandoId(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.cardTitle}>Top 10 últimas prealertas consolidadas</span>
          <span className={styles.countPill}>{consolidadas.length}</span>
        </div>
        <button
          className={styles.btnRefresh}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refrescar"
        >
          <span
            className={`material-symbols-rounded ${isLoading ? styles.spinning : ""}`}
          >
            refresh
          </span>
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Prealertas origen</th>
              <th>Creada</th>
              <th>Creado por</th>
              <th>Estado</th>
              <th>Formato</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>Cargando...</td>
              </tr>
            ) : consolidadas.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No hay prealertas consolidadas aún
                </td>
              </tr>
            ) : (
              consolidadas.map((c) => (
                <tr key={c.id}>
                  <td className={styles.tdMuted}>{c.id}</td>
                  <td>{c.nombre}</td>
                  <td className={styles.tdMuted}>{c.prealertasOrigen}</td>
                  <td className={styles.tdMuted}>{c.fecha ?? "-"}</td>
                  <td>{c.creadoPor}</td>
                  <td>
                    <span className={styles.badgeConsolidada}>{c.estado}</span>
                  </td>
                  <td>
                    <button
                      className={styles.btnDescargar}
                      onClick={() => handleDescargar(c)}
                      disabled={descargandoId === c.id}
                      title="Descargar formato de la prealerta con todos los seriales"
                    >
                      <span
                        className={`material-symbols-rounded ${descargandoId === c.id ? styles.spinning : ""}`}
                      >
                        {descargandoId === c.id ? "progress_activity" : "download"}
                      </span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

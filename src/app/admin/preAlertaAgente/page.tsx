"use client";

import React, { useState, useEffect } from "react";
import styles from "./prealerta.module.css";

// Definimos el tipo para evitar el error 'any' de ESLint
interface PrealertaItem {
  nombre: string;
  fecha?: string;
  estado?: string;
}

export default function PreAlertaAgentePage() {
  // 1. Estados con tipos definidos
  const [prealertas, setPrealertas] = useState<PrealertaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 2. Carga de datos desde la API (pa_GetListPrealert)
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch("/api/prealerta/list");
        if (!response.ok) throw new Error("Error al obtener datos");

        const data = await response.json();

        // Mapeamos los datos: si el SP solo devuelve un string, creamos el objeto
        const dataFormateada: PrealertaItem[] = data.map(
          (item: string | PrealertaItem) =>
            typeof item === "string" ? { nombre: item } : item,
        );

        setPrealertas(dataFormateada);
      } catch (error) {
        console.error("Fallo al cargar historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarHistorial();
  }, []);

  // 3. Función para Crear (pa_InsertPrealert)
  const handleCrearPrealerta = async () => {
    const nombreNuevo = prompt("Ingrese el nombre de la prealerta:");
    if (!nombreNuevo) return;

    try {
      const res = await fetch("/api/prealerta/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreNuevo,
          tipoOrigenId: 1,
          origenId: 100,
          guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
          usuarioId: 5321,
          idResponsable: 5321,
          estado: "PENDIENTE",
        }),
      });

      if (res.ok) {
        setPrealertas((prev) => [{ nombre: nombreNuevo }, ...prev]);
        alert("Prealerta creada exitosamente");
      }
    } catch (error) {
      alert("Error al insertar en la base de datos");
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* ENCABEZADO CON BOTÓN CONECTADO */}
      <div className={styles.headerContainer}>
        <h2 className={styles.cardTitle}>Historial Pre-Alerta Agentes</h2>
        <button
          type="button"
          className={styles.btnCreate}
          onClick={handleCrearPrealerta}
        >
          <span className="material-symbols-rounded">add_circle</span>
          CREAR PREALERTA
        </button>
      </div>

      {/* SECCIÓN SUPERIOR: Historial Dinámico */}
      <section className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.mainTable}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    Cargando historial...
                  </td>
                </tr>
              ) : prealertas.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No hay prealertas activas
                  </td>
                </tr>
              ) : (
                prealertas.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre}</td>
                    <td>{item.fecha || new Date().toLocaleDateString()}</td>
                    <td>
                      <span className={styles.badgePendiente}>
                        {item.estado || "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className={styles.btnAction}>
                        <span className="material-symbols-rounded">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECCIÓN MEDIA: Carga y Fecha */}
      <div className={styles.uploadRow}>
        <button type="button" className={styles.btnUpload}>
          <span className="material-symbols-rounded">upload_file</span>
          Cargar Recuperaciones Día
        </button>
        <div className={styles.inputGroup}>
          <label htmlFor="fechaProceso">Fecha Proceso</label>
          <input id="fechaProceso" type="date" className={styles.datePicker} />
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Grid de Trabajo */}
      <div className={styles.workGrid}>
        <div className={styles.card}>
          <div className={styles.checkList}>
            {[1, 2, 3, 4].map((i) => (
              <label key={i} className={styles.checkItem}>
                <input type="checkbox" />
                <span>Equipo Recuperado ID: {i}982</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Tipo Material</th>
                <th>Caja Asignada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Equipos</td>
                <td>
                  <input type="text" placeholder="Ej: J-12" />
                </td>
              </tr>
              <tr>
                <td>Accesorios</td>
                <td>
                  <input type="text" placeholder="Ej: J-13" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <footer className={styles.footerActions}>
        <button type="button" className={styles.btnEmpacar}>
          Empacar
        </button>
        <button type="button" className={styles.btnDesempacar}>
          Desempacar
        </button>
      </footer>
    </div>
  );
}

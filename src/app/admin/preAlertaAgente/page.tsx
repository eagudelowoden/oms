"use client";

import React from "react"; // Asegura que los elementos JSX se reconozcan
import styles from "./prealerta.module.css";

export default function PreAlertaAgentePage() {
  return (
    <div className={styles.wrapper}>
      
      {/* ENCABEZADO CON BOTÓN DE CREAR */}
      <div className={styles.headerContainer}>
        <h2 className={styles.cardTitle}>Historial Pre-Alerta Agente</h2>
        <button type="button" className={styles.btnCreate}>
          <span className="material-symbols-rounded">add_circle</span>
          CREAR PREALERTA
        </button>
      </div>

      {/* SECCIÓN SUPERIOR: Historial */}
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
              <tr>
                <td>Carga_001</td>
                <td>16/03/2026</td>
                <td><span className={styles.badgePendiente}>Pendiente</span></td>
                <td>
                  <button type="button" className={styles.btnAction}>
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </td>
              </tr>
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
          <input 
            id="fechaProceso"
            type="date" 
            className={styles.datePicker} 
          />
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Grid de Trabajo */}
      <div className={styles.workGrid}>
        {/* Lista de selección */}
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

        {/* Tabla de Materiales */}
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
                <td><input type="text" placeholder="Ej: J-12" /></td>
              </tr>
              <tr>
                <td>Accesorios</td>
                <td><input type="text" placeholder="Ej: J-13" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTONES DE CIERRE */}
      <footer className={styles.footerActions}>
        <button type="button" className={styles.btnEmpacar}>Empacar</button>
        <button type="button" className={styles.btnDesempacar}>Desempacar</button>
      </footer>
    </div>
  );
}
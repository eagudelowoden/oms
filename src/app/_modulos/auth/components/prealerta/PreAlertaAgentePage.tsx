"use client";

import React, { useState, useEffect } from "react";
import styles from "./prealerta.module.css";

export default function PreAlertaAgentePage() {
  // 1. Estados para los datos de la base de datos
  const [prealertas, setPrealertas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Cargar historial al montar el componente (pa_GetListPrealert)
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch("/api/prealerta/list");
        if (!response.ok) throw new Error("Error al obtener prealertas");
        const data = await response.json();
        setPrealertas(data);
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
          tipoOrigenId: 1, // Ajustar según lógica de tu negocio
          origenId: 100,
          guia: "GUIA-" + Math.floor(Math.random() * 1000),
          usuarioId: 5321, // Esto debería venir de tu contexto de usuario/session
          idResponsable: 5321,
          estado: "PENDIENTE"
        }),
      });

      if (res.ok) {
        // Recargar la lista localmente para ver el cambio
        setPrealertas((prev) => [...prev, nombreNuevo]);
        alert("Prealerta creada exitosamente en SQL");
      }
    } catch (error) {
      alert("Error al insertar en la base de datos");
    }
  };

  return (
    <div className={styles.wrapper}>
      
      {/* ENCABEZADO CON BOTÓN DE CREAR CONECTADO */}
      <div className={styles.headerContainer}>
        <h2 className={styles.cardTitle}>Historial Pre-Alerta Agente</h2>
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
                <tr><td colSpan={4}>Cargando datos de SQL...</td></tr>
              ) : prealertas.length === 0 ? (
                <tr><td colSpan={4}>No hay prealertas activas</td></tr>
              ) : (
                prealertas.map((nombre, index) => (
                  <tr key={index}>
                    <td>{nombre}</td>
                    <td>{new Date().toLocaleDateString()}</td> {/* Ajustar si el SP devuelve fecha */}
                    <td><span className={styles.badgePendiente}>Pendiente</span></td>
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

      {/* ... El resto de tu código de secciones inferiores ... */}
      <div className={styles.uploadRow}>
         {/* Aquí podrías conectar la carga de archivos */}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import styles from "./modalElegirCliente.module.css";

// 1. La interfaz ahora usa 'dbase' para ser fiel a la base de datos
interface Cliente {
  id: number;
  nombre: string;
  dbase: string; // Nombre técnico (ej: WmsWdGlobalLiberty)
}

interface ClientSwitchResponse {
  clientToken: string;
  clientDb: string;
  clientDbName: string;
}

interface ModalProps {
  usuarioId: number;
  onSuccess: (clientData: ClientSwitchResponse) => void;
  onCancel: () => void;
}

export default function ModalElegirCliente({
  usuarioId,
  onSuccess,
  onCancel,
}: ModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  // Cargar lista de clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(
          `/api/clientes/list?usuarioId=${usuarioId}`,
        );
        if (!response.ok) throw new Error("Error en la respuesta");

        const data: Cliente[] = await response.json();
        setClientes(data);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }
    };
    fetchClientes();
  }, [usuarioId]);

  const handleConfirmar = async () => {
    if (!seleccionado) return;
    setIsChanging(true);

    try {
      // 2. Enviamos 'dbase' como 'dbNameReal' para que la API lo reconozca
      const resSwitch = await fetch(`/api/clientes/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: seleccionado.id,
          clienteNombre: seleccionado.nombre,
          dbNameReal: seleccionado.dbase, // Pasamos el valor técnico sin modificar
        }),
      });

      const result: ClientSwitchResponse = await resSwitch.json();

      if (resSwitch.ok) {
        onSuccess(result);
      } else {
        alert(
          `Error: No se pudo conectar a la base de datos técnica del cliente.`,
        );
      }
    } catch (err) {
      console.error("Error en switch:", err);
      alert("Error de conexión al cambiar de cliente");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.header}>
          <span className="material-symbols-rounded">business_center</span>
          <h3>Seleccionar Cliente</h3>
        </div>

        <p>Selecciona la operación con la que deseas trabajar:</p>

        <select
          className={styles.select}
          // Usamos 'dbase' como valor de control para asegurar la coincidencia visual
          value={seleccionado?.dbase || ""}
          onChange={(e) => {
            const clienteEncontrado = clientes.find(
              (c) => c.dbase === e.target.value,
            );
            setSeleccionado(clienteEncontrado || null);
          }}
          disabled={isChanging}
        >
          <option value="" disabled>
            -- Seleccione un cliente --
          </option>
          {clientes.map((c, index) => (
            <option key={`${c.dbase}-${index}`} value={c.dbase}>
              {c.nombre}
            </option>
          ))}
        </select>

        <div className={styles.footerButtons}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.btnCancel}
            disabled={isChanging}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className={styles.btnConfirm}
            disabled={!seleccionado || isChanging}
          >
            {isChanging ? "Conectando..." : "INGRESAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

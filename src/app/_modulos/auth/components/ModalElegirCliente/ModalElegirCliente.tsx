"use client";

import { useState, useEffect } from "react";
import styles from "./modalElegirCliente.module.css";

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

export default function ModalElegirCliente({ usuarioId, onSuccess, onCancel }: ModalProps) {
  const [clientes, setClientes] = useState<string[]>([]);
  const [seleccionado, setSeleccionado] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  // 1. Cargar lista usando la API Unificada
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(`/api/clientes/list?usuarioId=${usuarioId}`);
        if (!response.ok) throw new Error("Error en la respuesta");
        const data: string[] = await response.json();
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
      // 2. Obtener ID usando la API Unificada
      const resId = await fetch(`/api/clientes/getId?nombre=${encodeURIComponent(seleccionado)}`);
      const clientId: number = await resId.json();

      // 3. Hacer el SWITCH (Esta es la parte de POST que unifica el token)
      const resSwitch = await fetch(`/api/clientes/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clienteNombre: seleccionado }),
      });
      
      const result: ClientSwitchResponse = await resSwitch.json();
      
      if (resSwitch.ok) {
        onSuccess(result); 
      } else {
        alert("No se pudo conectar con la base de datos del cliente");
      }
    } catch (err) {
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
          value={seleccionado}
          onChange={(e) => setSeleccionado(e.target.value)}
          disabled={isChanging}
        >
          <option value="">-- Seleccione un cliente --</option>
          {clientes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className={styles.footerButtons}>
          <button type="button" onClick={onCancel} className={styles.btnCancel}>
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
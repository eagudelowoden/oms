"use client";

import { useState, useEffect } from "react";
import styles from "./modalElegirCliente.module.css";

interface Cliente {
  id: number;
  nombre: string;
  dbase: string;
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
  const [busqueda, setBusqueda] = useState("");

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

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);
    // Deseleccionar si el seleccionado ya no está en los resultados
    if (
      seleccionado &&
      !seleccionado.nombre.toLowerCase().includes(valor.toLowerCase())
    ) {
      setSeleccionado(null);
    }
  };

  const handleConfirmar = async () => {
    if (!seleccionado) return;
    setIsChanging(true);

    try {
      const resSwitch = await fetch(`/api/clientes/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: seleccionado.id,
          clienteNombre: seleccionado.nombre,
          dbNameReal: seleccionado.dbase,
        }),
      });

      const result: ClientSwitchResponse = await resSwitch.json();

      if (resSwitch.ok) {
        onSuccess({ ...result, clientDbName: seleccionado.nombre });
      } else {
        alert("Error: No se pudo conectar a la base de datos.");
      }
    } catch (err) {
      console.error("Error en switch:", err);
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

        <p className={styles.subtitle}>
          Selecciona la operación con la que deseas trabajar:
        </p>

        {/* Buscador */}
        <div className={styles.searchWrapper}>
          <span className="material-symbols-rounded">search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={handleBusquedaChange}
            disabled={isChanging}
            autoFocus
          />
          {busqueda && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setBusqueda("");
                setSeleccionado(null);
              }}
              disabled={isChanging}
            >
              <span className="material-symbols-rounded">close</span>
            </button>
          )}
        </div>

        {/* Lista filtrada */}
        <ul className={styles.lista}>
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((c) => (
              <li
                key={c.dbase}
                className={`${styles.listaItem} ${seleccionado?.dbase === c.dbase ? styles.listaItemActivo : ""}`}
                onClick={() => !isChanging && setSeleccionado(c)}
              >
                <span className="material-symbols-rounded">
                  {seleccionado?.dbase === c.dbase
                    ? "radio_button_checked"
                    : "radio_button_unchecked"}
                </span>
                {c.nombre}
              </li>
            ))
          ) : (
            <li className={styles.sinResultados}>
              <span className="material-symbols-rounded">search_off</span>
              Sin resultados para "{busqueda}"
            </li>
          )}
        </ul>

        {/* Botones */}
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

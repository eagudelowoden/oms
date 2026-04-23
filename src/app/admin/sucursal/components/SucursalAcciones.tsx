import React, { useRef } from "react";
import styles from "../css/prealerta.module.css";
import { PrealertaItem } from "@/app/models/Prealerta.models";
import { CajaItem, SerialEmpacado } from "@/app/models/seriales.models";

interface Props {
  seleccionada: PrealertaItem | null;
  onClearSeleccion: () => void;
  onAbrirScanner: () => void;
  onShowToast: (msg: string, type?: "ok" | "error") => void;
  onSincronizar: (fecha: string) => void;
  sincronizando: boolean;
  onSincronizarAccesorios: (fecha?: string) => void;
  sincronizandoAccesorios: boolean;
  onEmpacar: () => void;
  empacando: boolean;
  progreso: number;
  cajaActual: number;
  onCajaChange: (caja: number) => void;
  onDesempacar: () => void;
  cajas: CajaItem[];
  serialesDeCaja: SerialEmpacado[];
}

export default function PrealertaAcciones({
  seleccionada,
  onAbrirScanner,
  onShowToast,
  onSincronizar,
  sincronizando,
  onEmpacar,
  empacando,
  progreso,
  cajaActual,
  onCajaChange,
  onDesempacar,
  cajas,
}: Props) {
  const fechaRef = useRef<HTMLInputElement>(null);

  const siguienteNumero = (cajas.at(-1)?.numero ?? 0) + 1;
}

import { SerialItem } from "./seriales.models";

export interface PropsSincronizarSeriales {
  isOpen: boolean;
  fecha: string;
  sincronizando: boolean;
  serialesPrevista: SerialItem[];
  guardando: boolean;
  onClose: () => void;
  onSincronizar: (fecha: string, documento: string) => void;
  onGuardar: () => void;
  onVolver: () => void;
}
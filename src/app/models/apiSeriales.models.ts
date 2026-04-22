export interface PropsSincronizarSeriales {
    isOpen: boolean;
    fecha: string;
    onClose: () => void;
    onConfirm: (fecha: string, documento: string) => void;
}
export interface AccesorioAgrupado {
    codigoAccesorio: string;
    accesorio: string;
    cantidad: number;
}

export interface PropsSincronizarAccesorios {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (accesorios: AccesorioAgrupado[]) => void;
    sincronizando: boolean;
}

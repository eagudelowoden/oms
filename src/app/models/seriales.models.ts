export interface SerialItem {
    codigo: string;
    origen: "manual" | "api";
    estado?: "Empacado" | "Pendiente" | "Disponible";
    tipo?: "Serializable" | "No-serializable";
    mac?: string;
    caja?: number;
    cantidad?: number;
    descripcion?: string;
    codigo_sap?: string;
    tramite?: string;
}

export interface CajaItem {
    numero: number;
    totalSeriales: number;
    estado: "abierta" | "cerrada";
}

export interface SerialEmpacado {
    serial: string;
    mac: string;
    tipo: string;
    cantidad: number;
}
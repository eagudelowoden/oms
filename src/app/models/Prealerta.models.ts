// src/models/prealerta.ts
export interface PrealertaItem {
    id?: number;
    nombre: string;
    fecha?: string;
    estado?: string;
    usuarioId?: number;
    usuarioNombre?: string;
    tipoOrigenId?: number;
    origenId?: number;
}

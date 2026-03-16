export interface UsuarioModel {
    id: number;
    identificacion: number;
    nombres: string;
    apellidos: string;
    nombreUsuario: string;
    clave?: string; // Opcional porque no siempre queremos exponerla
    fechaNacimiento?: string;
    correo: string;
    cargoId: number;
    areaId: number;
    temaId: number;
    fechaCreacion: string;
    fechaUltimoAcceso?: string;
    ip?: string;
    sedeId: number;
    activo: boolean;
    
    // Estos son los @Transient que tenías en Java
    cargo?: string;
    area?: string;
    claveHash?: string;
}
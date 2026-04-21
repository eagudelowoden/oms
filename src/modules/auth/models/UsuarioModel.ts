export interface UsuarioModel {
  id: number;
  identificacion: number;
  nombres: string;
  apellidos: string;
  nombreUsuario: string;
  clave?: string;
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
  cargo?: string;
  area?: string;
  claveHash?: string;
}

// lib/db/types.ts
export interface DB {
  Prealerta: PrealertaTable;
  PrealertaSerial: PrealertaSerialTable;
  Cajas: CajaRow;
  Sede: SedeTable;
  UsuarioSys: UsuarioSysTable;
}

export interface PrealertaTable {
  Id: number;
  Nombre: string;
  TipoOrigenId: number;
  OrigenId: number;
  Guia: string;
  UsuarioId: number;
  Fecha: Date;
  IdResponsable: number;
  Estado: string;
  Activo: boolean;
}

export interface PrealertaSerialTable {
  Id: number;
  PrealertaId: number;
  Serial: string;
  Mac: string | null;
  CodigoSap: string | null;
  Descripcion: string | null;
  Cantidad: number;
  Caja: number;
  Falla: string | null;
  TecnicoCliente: string | null;
  Pedido: string | null;
  Tramite: string | null;
  Novedad: string | null;
  Garantia: number | null;
  Tipo: string | null;
}
export interface CajaRow {
  numero: number;
  totalSeriales: number;
}

export interface SedeTable {
  Id: number;
  Nombre: string;
}

export interface UsuarioSysTable {
  Id: number;
  nombres: string;
}

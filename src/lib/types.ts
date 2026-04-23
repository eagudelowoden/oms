// lib/db/types.ts
export interface DB {
  Prealerta: PrealertaTable;
  PrealertaSerial: PrealertaSerialTable;
  Cajas: CajaRow;
  SerialCaja: SerialCaja;
  Sede: SedeTable;
  PrealertaListRow: PrealertaListRow;
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
  codigo: string | null;
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

export interface SerialCaja {
  serial: string;
  mac: string | null;
  tipo: string | null;
  cantidad: number | null;
  tramite: string | null;
}

export interface PrealertaListRow {
  Id: number;
  Nombre: string | null;
  Fecha: Date | string | null;
  Estado: string | null;
  UsuarioId: number | null;
  TipoOrigenId: number | null;
  OrigenId: number | null;
  UsuarioNombre: string | null;
}

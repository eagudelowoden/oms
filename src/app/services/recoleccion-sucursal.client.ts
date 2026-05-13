import {
  PrealertaSucursalRow,
  SerialRecoleccionRow,
  AccesorioRecoleccionRow,
} from "./recoleccion-sucursal.service";

const BASE = "/api/recoleccion-sucursal";

export const recoleccionSucursalQueries = {
  prealertas: async (): Promise<PrealertaSucursalRow[]> => {
    const res = await fetch(`${BASE}/prealertas`);
    if (!res.ok) throw new Error("Error al obtener prealertas");
    return res.json();
  },

  seriales: async (prealertaId: number): Promise<SerialRecoleccionRow[]> => {
    const res = await fetch(`${BASE}/seriales?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener seriales");
    return res.json();
  },

  accesorios: async (prealertaId: number): Promise<AccesorioRecoleccionRow[]> => {
    const res = await fetch(`${BASE}/accesorios?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener accesorios");
    return res.json();
  },
};

export const recoleccionSucursalMutations = {
  escanear: async (
    prealertaId: number,
    serial: string,
  ): Promise<{ found: boolean; id?: number }> => {
    const res = await fetch(`${BASE}/escanear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, serial }),
    });
    if (!res.ok) throw new Error("Error al procesar escaneo");
    return res.json();
  },

  updateAccesorio: async (
    serialId: number,
    cantidadRecibida: number,
  ): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/updateAccesorio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serialId, cantidadRecibida }),
    });
    if (!res.ok) throw new Error("Error al actualizar accesorio");
    return res.json();
  },

  cerrarVerificacion: async (
    prealertaId: number,
  ): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/cerrarVerificacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId }),
    });
    if (!res.ok) throw new Error("Error al cerrar verificación");
    return res.json();
  },
};

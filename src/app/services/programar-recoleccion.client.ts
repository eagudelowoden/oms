import { PrealertaRecoleccionRow, MaterialRow } from "./programar-recoleccion.service";

const BASE = "/api/programar-recoleccion";

export const programarRecoleccionQueries = {
  list: async (): Promise<PrealertaRecoleccionRow[]> => {
    const res = await fetch(`${BASE}/list`);
    if (!res.ok) throw new Error("Error al obtener prealertas");
    return res.json();
  },

  materiales: async (prealertaId: number): Promise<MaterialRow[]> => {
    const res = await fetch(`${BASE}/materiales?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener materiales");
    return res.json();
  },
};

export const programarRecoleccionMutations = {
  programar: async (prealertaId: number, fecha: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/programar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, fecha }),
    });
    if (!res.ok) throw new Error("Error al programar recolección");
    return res.json();
  },

  desprogramar: async (prealertaId: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/desprogramar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId }),
    });
    if (!res.ok) throw new Error("Error al desprogramar recolección");
    return res.json();
  },

  verificarEmpacado: async (prealertaId: number): Promise<{ empacado: boolean }> => {
    const res = await fetch(`${BASE}/verificarEmpacado?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al verificar empacado");
    return res.json();
  },

  autorizar: async (prealertaId: number, noAutorizacion: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/autorizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, noAutorizacion }),
    });
    if (!res.ok) throw new Error("Error al autorizar recolección");
    return res.json();
  },
};

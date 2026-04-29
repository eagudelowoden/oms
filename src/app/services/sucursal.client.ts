import { PrealertaItem } from "@/app/models/Prealerta.models";
import { CajaItem, SerialEmpacado, SerialItem } from "@/app/models/seriales.models";

const BASE = "/api/sucursal";

// ── QUERIES ────────────────────────────────────────────────────────────────

export const sucursalQueries = {
  list: async (): Promise<PrealertaItem[]> => {
    const res = await fetch(`${BASE}/list`);
    if (!res.ok) throw new Error("Error al obtener prealertas");
    return res.json();
  },

  seriales: async (prealertaId: number): Promise<SerialItem[]> => {
    const res = await fetch(`${BASE}/seriales?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener seriales");
    return res.json();
  },

  cajas: async (prealertaId: number): Promise<CajaItem[]> => {
    const res = await fetch(`${BASE}/cajas?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener cajas");
    const data = await res.json();
    return data.cajas ?? [];
  },

  serialesPorCaja: async (prealertaId: number, caja: number): Promise<SerialEmpacado[]> => {
    const res = await fetch(`${BASE}/serialesPorCaja?prealertaId=${prealertaId}&caja=${caja}`);
    if (!res.ok) throw new Error("Error al obtener seriales de caja");
    return res.json();
  },

  sedes: async (): Promise<{ id: number; nombre: string }[]> => {
    const res = await fetch(`${BASE}/sedes`);
    if (!res.ok) throw new Error("Error al obtener sedes");
    return res.json();
  },
};

// ── MUTATIONS ──────────────────────────────────────────────────────────────

export const sucursalMutations = {
  create: async (body: Record<string, unknown>): Promise<{ success: boolean; id: number | null }> => {
    const res = await fetch(`${BASE}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al crear prealerta");
    return res.json();
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Error al eliminar prealerta");
    return res.json();
  },

  empacar: async (body: Record<string, unknown>): Promise<{ exitosos: number; yaExistian: number; fallidos: number }> => {
    const res = await fetch(`${BASE}/insertSerialBatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al empacar seriales");
    return res.json();
  },

  desempacar: async (prealertaId: number, seriales: string[]): Promise<{ eliminados: number }> => {
    const res = await fetch(`${BASE}/desempacar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, seriales }),
    });
    if (!res.ok) throw new Error("Error al desempacar seriales");
    return res.json();
  },

  eliminarSerial: async (prealertaId: number, serial: string): Promise<{ eliminados: number }> => {
    const res = await fetch(`${BASE}/eliminarSerial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, serial }),
    });
    if (!res.ok) throw new Error("Error al eliminar serial");
    return res.json();
  },
};

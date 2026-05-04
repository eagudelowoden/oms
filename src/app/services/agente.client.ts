import { PrealertaItem } from "@/app/models/Prealerta.models";
import {
  SerialItem,
  CajaItem,
  SerialEmpacado,
} from "@/app/models/seriales.models";

export const prealertaQueries = {
  list: async (): Promise<PrealertaItem[]> => {
    const res = await fetch("/api/agente/list");
    if (!res.ok) throw new Error("Error al obtener prealertas");
    return res.json();
  },

  seriales: async (prealertaId: number): Promise<SerialItem[]> => {
    const res = await fetch(`/api/agente/seriales?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener seriales");
    return res.json();
  },

  cajas: async (prealertaId: number): Promise<CajaItem[]> => {
    const res = await fetch(`/api/agente/cajas?prealertaId=${prealertaId}`);
    if (!res.ok) throw new Error("Error al obtener cajas");
    const data = await res.json();
    return data.cajas;
  },

  serialesPorCaja: async (
    prealertaId: number,
    caja: number,
  ): Promise<SerialEmpacado[]> => {
    const res = await fetch(
      `/api/agente/serialesPorCaja?prealertaId=${prealertaId}&caja=${caja}`,
    );
    if (!res.ok) throw new Error("Error al obtener seriales de caja");
    return res.json();
  },

  sedes: async () => {
    const res = await fetch("/api/agente/sedes");
    if (!res.ok) throw new Error("Error al obtener sedes");
    return res.json();
  },

  codigosSap: async (): Promise<{ codigo: string; descripcion: string }[]> => {
    const res = await fetch("/api/agente/codigosSap");
    if (!res.ok) throw new Error("Error al obtener CodigoSap");
    return res.json();
  },
};

// ── MUTATIONS (POST/DELETE) ──
export const prealertaMutations = {
  create: async (body: Record<string, unknown>) => {
    const res = await fetch("/api/agente/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al crear prealerta");
    return res.json();
  },

  delete: async (id: number) => {
    const res = await fetch("/api/agente/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Error al eliminar prealerta");
    return res.json();
  },

  empacar: async (body: Record<string, unknown>): Promise<{ exitosos: number; yaExistian: number; fallidos: number; enOtraPrealerta: number }> => {
    const res = await fetch("/api/agente/insertSerialBatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Error al empacar");
    return res.json();
  },

  desempacar: async (prealertaId: number, seriales: string[]) => {
    const res = await fetch("/api/agente/desempacar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, seriales }),
    });
    if (!res.ok) throw new Error("Error al desempacar");
    return res.json();
  },

  eliminarSerial: async (prealertaId: number, serial: string) => {
    const res = await fetch("/api/agente/eliminarSerial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prealertaId, serial }),
    });
    if (!res.ok) throw new Error("Error al eliminar serial");
    return res.json();
  },
};

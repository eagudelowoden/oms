import {
  PrealertaConsolidarRow,
  MaterialConsolidarRow,
  AccesorioConsolidarRow,
  PrealertaConsolidadaRow,
  SerialDescargaRow,
} from "./consolidar-prealertas.service";

const BASE = "/api/consolidar-prealertas";

export const consolidarQueries = {
  list: async (): Promise<PrealertaConsolidarRow[]> => {
    const res = await fetch(`${BASE}/list`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail =
        (body as { detail?: string; error?: string })?.detail ??
        (body as { detail?: string; error?: string })?.error ??
        `HTTP ${res.status}`;
      throw new Error(detail);
    }
    return res.json();
  },

  materiales: async (ids: number[]): Promise<MaterialConsolidarRow[]> => {
    if (ids.length === 0) return [];
    const res = await fetch(
      `${BASE}/materiales?ids=${ids.join(",")}`,
    );
    if (!res.ok) throw new Error("Error al cargar materiales");
    return res.json();
  },

  accesorios: async (ids: number[]): Promise<AccesorioConsolidarRow[]> => {
    if (ids.length === 0) return [];
    const res = await fetch(
      `${BASE}/accesorios?ids=${ids.join(",")}`,
    );
    if (!res.ok) throw new Error("Error al cargar accesorios");
    return res.json();
  },

  consolidadas: async (): Promise<PrealertaConsolidadaRow[]> => {
    const res = await fetch(`${BASE}/consolidadas`);
    if (!res.ok) throw new Error("Error al cargar consolidadas");
    return res.json();
  },

  serialesDescarga: async (id: number): Promise<SerialDescargaRow[]> => {
    const res = await fetch(`${BASE}/seriales-descarga?id=${id}`);
    if (!res.ok) throw new Error("Error al cargar los seriales de la prealerta");
    return res.json();
  },
};

export const consolidarMutations = {
  consolidar: async (
    ids: number[],
    usuarioId: number,
  ): Promise<{ id: number; nombre: string }> => {
    const res = await fetch(`${BASE}/consolidar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, usuarioId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        (body as { error?: string })?.error ?? "Error al consolidar",
      );
    }
    return res.json();
  },
};

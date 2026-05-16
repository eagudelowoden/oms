import { PrealertaEnvioRow } from "./confirmar-envio.service";

const BASE = "/api/confirmar-envio";

export const confirmarEnvioQueries = {
  list: async (): Promise<PrealertaEnvioRow[]> => {
    const res = await fetch(`${BASE}/list`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = (body as { detail?: string; error?: string })?.detail
        ?? (body as { detail?: string; error?: string })?.error
        ?? `HTTP ${res.status}`;
      throw new Error(detail);
    }
    return res.json();
  },
};

export const confirmarEnvioMutations = {
  confirmar: async (id: number): Promise<{ success: boolean }> => {
    const res = await fetch(`${BASE}/confirmar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Error al confirmar envío");
    return res.json();
  },
};

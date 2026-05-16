"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmarEnvioQueries,
  confirmarEnvioMutations,
} from "@/app/services/confirmar-envio.client";
import { PrealertaEnvioRow } from "@/app/services/confirmar-envio.service";

export function useConfirmarEnvio() {
  const queryClient = useQueryClient();

  const [seleccionada, setSeleccionada] = useState<PrealertaEnvioRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── QUERY ── */
  const { data: prealertas = [], isLoading, refetch: refetchPrealertas } = useQuery({
    queryKey: ["confirmar-envio-prealertas"],
    queryFn: confirmarEnvioQueries.list,
  });

  /* ── MUTATION ── */
  const confirmarMutation = useMutation({
    mutationFn: (id: number) => confirmarEnvioMutations.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confirmar-envio-prealertas"] });
      setSeleccionada(null);
      showToast("✓ Envío confirmado correctamente");
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al confirmar envío", "error");
    },
  });

  /* ── HANDLER ── */
  const handleConfirmar = () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    confirmarMutation.mutate(seleccionada.id);
  };

  const isPending = confirmarMutation.isPending;

  return {
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    toast,
    isPending,
    handleConfirmar,
  };
}

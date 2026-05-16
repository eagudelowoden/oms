"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmarRecepcionQueries,
  confirmarRecepcionMutations,
} from "@/app/services/confirmar-recepcion.client";
import { PrealertaRecepcionRow } from "@/app/services/confirmar-recepcion.service";

export function useConfirmarRecepcion() {
  const queryClient = useQueryClient();

  const [seleccionada, setSeleccionada] = useState<PrealertaRecepcionRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── QUERY ── */
  const { data: prealertas = [], isLoading, refetch: refetchPrealertas } = useQuery({
    queryKey: ["confirmar-recepcion-prealertas"],
    queryFn: confirmarRecepcionQueries.list,
  });

  /* ── MUTATION ── */
  const confirmarMutation = useMutation({
    mutationFn: (id: number) => confirmarRecepcionMutations.confirmar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confirmar-recepcion-prealertas"] });
      setSeleccionada(null);
      showToast("✓ Recepción confirmada correctamente");
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al confirmar recepción", "error");
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

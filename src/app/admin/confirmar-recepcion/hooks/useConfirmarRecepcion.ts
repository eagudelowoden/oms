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
  const {
    data: prealertas = [],
    isLoading,
    isError,
    error,
    refetch: refetchPrealertas,
  } = useQuery({
    queryKey: ["confirmar-recepcion-prealertas"],
    queryFn: confirmarRecepcionQueries.list,
    retry: 1,
  });

  /* ── MUTATION ── */
  const confirmarMutation = useMutation({
    mutationFn: (id: number) => confirmarRecepcionMutations.confirmar(id),
    onSuccess: (_data, id) => {
      // Actualizar estado en cache local sin recargar la lista
      queryClient.setQueryData<PrealertaRecepcionRow[]>(
        ["confirmar-recepcion-prealertas"],
        (prev) =>
          prev?.map((p) => (p.id === id ? { ...p, estado: "Recibido" } : p)) ?? [],
      );
      setSeleccionada((prev) => prev ? { ...prev, estado: "Recibido" } : prev);
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
  const errorMsg = isError ? (error instanceof Error ? error.message : "Error al cargar datos") : null;

  return {
    prealertas,
    isLoading,
    isError,
    errorMsg,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    toast,
    isPending,
    handleConfirmar,
  };
}

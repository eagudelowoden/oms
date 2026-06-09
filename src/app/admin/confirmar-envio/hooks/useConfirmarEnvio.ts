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
  const {
    data: prealertas = [],
    isLoading,
    isError,
    error,
    refetch: refetchPrealertas,
  } = useQuery({
    queryKey: ["confirmar-envio-prealertas"],
    queryFn: confirmarEnvioQueries.list,
    retry: 1,
  });

  /* ── MUTATION ── */
  const confirmarMutation = useMutation({
    mutationFn: (id: number) => confirmarEnvioMutations.confirmar(id),
    onSuccess: (_data, id) => {
      const fechaEnvio = new Date().toLocaleString("es-CO");
      // Actualizar estado y fecha de envío en cache local
      queryClient.setQueryData<PrealertaEnvioRow[]>(
        ["confirmar-envio-prealertas"],
        (prev) =>
          prev?.map((p) =>
            p.id === id ? { ...p, estado: "Enviado", fechaEnvio } : p,
          ) ?? [],
      );
      setSeleccionada((prev) =>
        prev ? { ...prev, estado: "Enviado", fechaEnvio } : prev,
      );
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

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  programarRecoleccionQueries,
  programarRecoleccionMutations,
} from "@/app/services/programar-recoleccion.client";
import { PrealertaRecoleccionRow } from "@/app/services/programar-recoleccion.service";

export function useProgramarRecoleccion() {
  const queryClient = useQueryClient();

  const hoy = new Date().toISOString().split("T")[0];

  const [fecha, setFecha] = useState<string>(hoy);
  const [seleccionada, setSeleccionada] = useState<PrealertaRecoleccionRow | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── QUERIES ── */
  const { data: prealertas = [], isLoading, refetch: refetchPrealertas } = useQuery({
    queryKey: ["programar-prealertas"],
    queryFn: programarRecoleccionQueries.list,
  });

  const { data: materiales = [], isFetching: cargandoMateriales } = useQuery({
    queryKey: ["programar-materiales", seleccionada?.id],
    queryFn: () => programarRecoleccionQueries.materiales(seleccionada!.id),
    enabled: !!seleccionada?.id,
    staleTime: 0,
  });

  /* ── MUTATIONS ── */
  const programarMutation = useMutation({
    mutationFn: ({ id, f }: { id: number; f: string }) =>
      programarRecoleccionMutations.programar(id, f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programar-prealertas"] });
      showToast("✓ Recolección programada correctamente");
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al programar", "error");
    },
  });

  const desprogramarMutation = useMutation({
    mutationFn: (id: number) => programarRecoleccionMutations.desprogramar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programar-prealertas"] });
      showToast("✓ Recolección desprogramada");
    },
    onError: () => showToast("Error al desprogramar", "error"),
  });

/* ── HANDLERS ── */
  const handleProgramar = async () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    if (!fecha) {
      showToast("Selecciona una fecha", "error");
      return;
    }

    const { empacado } = await programarRecoleccionMutations.verificarEmpacado(seleccionada.id);
    if (!empacado) {
      showToast(
        "Todos los materiales deben estar empacados para poder programar",
        "error",
      );
      return;
    }

    programarMutation.mutate({ id: seleccionada.id, f: fecha });
  };

  const handleDesprogramar = () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    desprogramarMutation.mutate(seleccionada.id);
  };

  const isPending =
    programarMutation.isPending || desprogramarMutation.isPending;

  return {
    fecha,
    setFecha,
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    materiales,
    cargandoMateriales,
    toast,
    isPending,
    handleProgramar,
    handleDesprogramar,
  };
}

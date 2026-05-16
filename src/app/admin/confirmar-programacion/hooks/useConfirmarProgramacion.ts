"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  programarRecoleccionQueries,
  programarRecoleccionMutations,
} from "@/app/services/programar-recoleccion.client";
import { PrealertaRecoleccionRow } from "@/app/services/programar-recoleccion.service";

export function useConfirmarProgramacion() {
  const queryClient = useQueryClient();

  const hoy = new Date().toISOString().split("T")[0];

  const [fecha, setFecha] = useState<string>(hoy);
  const [seleccionada, setSeleccionada] = useState<PrealertaRecoleccionRow | null>(null);
  const [noAutorizacion, setNoAutorizacion] = useState<string>("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── QUERIES ── */
  const { data: prealertas = [], isLoading, refetch: refetchPrealertas } = useQuery({
    queryKey: ["confirmar-prealertas"],
    queryFn: programarRecoleccionQueries.listProgramadas,
  });

  const { data: materiales = [], isFetching: cargandoMateriales } = useQuery({
    queryKey: ["confirmar-materiales", seleccionada?.id],
    queryFn: () => programarRecoleccionQueries.materiales(seleccionada!.id),
    enabled: !!seleccionada?.id,
    staleTime: 0,
  });

  /* ── MUTATIONS ── */
  const reprogramarMutation = useMutation({
    mutationFn: ({ id, f }: { id: number; f: string }) =>
      programarRecoleccionMutations.programar(id, f),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confirmar-prealertas"] });
      showToast("✓ Fecha reprogramada correctamente");
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al reprogramar", "error");
    },
  });

  const autorizarMutation = useMutation({
    mutationFn: ({ id, no }: { id: number; no: string }) =>
      programarRecoleccionMutations.autorizar(id, no),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confirmar-prealertas"] });
      setNoAutorizacion("");
      showToast("✓ Recolección autorizada correctamente");
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al autorizar", "error");
    },
  });

  /* ── HANDLERS ── */
  const handleReprogramar = async () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    if (!fecha) {
      showToast("Selecciona una fecha", "error");
      return;
    }
    reprogramarMutation.mutate({ id: seleccionada.id, f: fecha });
  };

  const handleAutorizar = () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    if (!noAutorizacion.trim()) {
      showToast("Ingresa el número de autorización", "error");
      return;
    }
    autorizarMutation.mutate({ id: seleccionada.id, no: noAutorizacion.trim() });
  };

  const isPending = reprogramarMutation.isPending || autorizarMutation.isPending;

  const materialesConTecnico = materiales.map((m) => ({
    ...m,
    tecnico: m.tecnico || seleccionada?.usuarioNombre || "",
  }));

  return {
    fecha,
    setFecha,
    prealertas,
    isLoading,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    materiales: materialesConTecnico,
    cargandoMateriales,
    toast,
    isPending,
    noAutorizacion,
    setNoAutorizacion,
    handleReprogramar,
    handleAutorizar,
  };
}

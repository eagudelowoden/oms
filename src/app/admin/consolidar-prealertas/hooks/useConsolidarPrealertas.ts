"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  consolidarQueries,
  consolidarMutations,
} from "@/app/services/consolidar-prealertas.client";
import { PrealertaConsolidarRow } from "@/app/services/consolidar-prealertas.service";

function getUsuarioId(): number {
  try {
    const raw = localStorage.getItem("usuario") ?? "{}";
    const user = JSON.parse(raw) as { id?: number };
    return user.id ?? 0;
  } catch {
    return 0;
  }
}

export function useConsolidarPrealertas() {
  const queryClient = useQueryClient();
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const {
    data: prealertas = [],
    isLoading: loadingPrealertas,
    isError: errorPrealertas,
    refetch: refetchPrealertas,
  } = useQuery({
    queryKey: ["consolidar-prealertas-list"],
    queryFn: consolidarQueries.list,
    retry: 1,
  });

  const selectedIds = useMemo(() => Array.from(seleccionadas), [seleccionadas]);

  const {
    data: materiales = [],
    isLoading: loadingMateriales,
  } = useQuery({
    queryKey: ["consolidar-materiales", selectedIds],
    queryFn: () => consolidarQueries.materiales(selectedIds),
    enabled: selectedIds.length > 0,
  });

  const {
    data: accesorios = [],
    isLoading: loadingAccesorios,
  } = useQuery({
    queryKey: ["consolidar-accesorios", selectedIds],
    queryFn: () => consolidarQueries.accesorios(selectedIds),
    enabled: selectedIds.length > 0,
  });

  const {
    data: consolidadas = [],
    isLoading: loadingConsolidadas,
    refetch: refetchConsolidadas,
  } = useQuery({
    queryKey: ["consolidar-consolidadas"],
    queryFn: consolidarQueries.consolidadas,
    retry: 1,
  });

  const consolidarMutation = useMutation({
    mutationFn: ({ ids, usuarioId }: { ids: number[]; usuarioId: number }) =>
      consolidarMutations.consolidar(ids, usuarioId),
    onSuccess: (data) => {
      showToast(`✓ ${data.nombre} creada correctamente`);
      setSeleccionadas(new Set());
      queryClient.invalidateQueries({ queryKey: ["consolidar-prealertas-list"] });
      queryClient.invalidateQueries({ queryKey: ["consolidar-consolidadas"] });
    },
    onError: (err: Error) => {
      showToast(err.message || "Error al consolidar", "error");
    },
  });

  const toggleSeleccion = (p: PrealertaConsolidarRow) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) {
        next.delete(p.id);
      } else {
        next.add(p.id);
      }
      return next;
    });
  };

  const handleConsolidar = () => {
    if (selectedIds.length < 2) {
      showToast("Selecciona al menos 2 prealertas para consolidar", "error");
      return;
    }
    const usuarioId = getUsuarioId();
    if (!usuarioId) {
      showToast("No se pudo obtener el usuario. Inicia sesión de nuevo.", "error");
      return;
    }
    consolidarMutation.mutate({ ids: selectedIds, usuarioId });
  };

  return {
    prealertas,
    loadingPrealertas,
    errorPrealertas,
    refetchPrealertas,
    seleccionadas,
    selectedIds,
    toggleSeleccion,
    materiales,
    loadingMateriales,
    accesorios,
    loadingAccesorios,
    consolidadas,
    loadingConsolidadas,
    refetchConsolidadas,
    handleConsolidar,
    isPending: consolidarMutation.isPending,
    toast,
  };
}

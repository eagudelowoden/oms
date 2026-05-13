"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  recoleccionSucursalQueries,
  recoleccionSucursalMutations,
} from "@/app/services/recoleccion-sucursal.client";
import { PrealertaSucursalRow } from "@/app/services/recoleccion-sucursal.service";

export function useRecoleccionSucursal() {
  const queryClient = useQueryClient();

  const [seleccionada, setSeleccionada] = useState<PrealertaSucursalRow | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "error" } | null>(null);

  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── QUERIES ── */
  const { data: prealertas = [], isLoading: loadingPrealertas, refetch: refetchPrealertas } =
    useQuery({
      queryKey: ["recoleccion-prealertas"],
      queryFn: recoleccionSucursalQueries.prealertas,
    });

  const { data: seriales = [], isFetching: loadingSeriales, refetch: refetchSeriales } =
    useQuery({
      queryKey: ["recoleccion-seriales", seleccionada?.id],
      queryFn: () => recoleccionSucursalQueries.seriales(seleccionada!.id),
      enabled: !!seleccionada?.id,
      staleTime: 0,
    });

  const { data: accesorios = [], isFetching: loadingAccesorios } = useQuery({
    queryKey: ["recoleccion-accesorios", seleccionada?.id],
    queryFn: () => recoleccionSucursalQueries.accesorios(seleccionada!.id),
    enabled: !!seleccionada?.id,
    staleTime: 0,
  });

  /* ── STATS (calculadas del cliente) ── */
  const serialesARecoger = seriales.length;
  const serialesRecogidos = seriales.filter((s) => s.recogido === 1).length;
  const accesoriosARecoger = accesorios.reduce((sum, a) => sum + a.cantidad, 0);
  const accesoriosRecogidos = accesorios.reduce((sum, a) => sum + a.cantidadRecibida, 0);

  /* ── MUTATIONS ── */
  const escanearMutation = useMutation({
    mutationFn: ({ serial }: { serial: string }) =>
      recoleccionSucursalMutations.escanear(seleccionada!.id, serial),
    onSuccess: (result) => {
      if (result.found) {
        queryClient.invalidateQueries({ queryKey: ["recoleccion-seriales", seleccionada?.id] });
        showToast("✓ Serial recogido correctamente");
      } else {
        showToast(
          "Serial no reportado para recoger — informe al usuario de la sucursal que no puede transportarlo",
          "error",
        );
      }
    },
    onError: () => showToast("Error al procesar el escaneo", "error"),
  });

const cerrarVerificacionMutation = useMutation({
    mutationFn: () => recoleccionSucursalMutations.cerrarVerificacion(seleccionada!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recoleccion-prealertas"] });
      setSeleccionada(null);
      showToast("✓ Verificación cerrada — prealerta en tránsito");
    },
    onError: () => showToast("Error al cerrar la verificación", "error"),
  });

  /* ── HANDLERS ── */
  const handleScan = (serial: string) => {
    if (!seleccionada) return;
    escanearMutation.mutate({ serial });
  };

  const handleCerrarVerificacion = () => {
    if (!seleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    cerrarVerificacionMutation.mutate();
  };

  return {
    prealertas,
    loadingPrealertas,
    refetchPrealertas,
    seleccionada,
    setSeleccionada,
    seriales,
    loadingSeriales,
    refetchSeriales,
    accesorios,
    loadingAccesorios,
    serialesARecoger,
    serialesRecogidos,
    accesoriosARecoger,
    accesoriosRecogidos,
    scannerOpen,
    setScannerOpen,
    toast,
    handleScan,
    handleCerrarVerificacion,
    isPending: cerrarVerificacionMutation.isPending,
  };
}

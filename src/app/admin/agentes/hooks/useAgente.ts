"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  prealertaQueries,
  prealertaMutations,
} from "@/app/services/agente.client";
import { PrealertaItem } from "@/app/models/Prealerta.models";
import { SerialItem } from "@/app/models/seriales.models";
import { UsuarioSesion } from "@/app/models/UsuarioSesion";
import { useSincronizarAPI } from "./useSincronizarSeriales";

export function usePrealerta() {
  const queryClient = useQueryClient();

  // ── UI STATE ──
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<"nombre" | "fecha" | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serialesEscaneados, setSerialEscaneados] = useState<SerialItem[]>([]);
  const [confirmItem, setConfirmItem] = useState<PrealertaItem | null>(null);
  const [preAlertaSeleccionada, setPreAlertaSeleccionada] =
    useState<PrealertaItem | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "error";
  } | null>(null);
  const [empacando, setEmpacando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [cajaActual, setCajaActual] = useState(1);
  const [sincronizandoAccesorios, setSincronizandoAccesorios] = useState(false);
  const [modalAccesorios, setModalAccesorios] = useState(false);

  /* ── TOAST ── */
  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── QUERIES ── */
  const { data: prealertas = [], isLoading } = useQuery({
    queryKey: ["prealertas"],
    queryFn: prealertaQueries.list,
  });

  const { data: serialesDeDB = [] } = useQuery({
    queryKey: ["seriales", preAlertaSeleccionada?.id],
    queryFn: () => prealertaQueries.seriales(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
  });

  const { data: cajas = [] } = useQuery({
    queryKey: ["cajas", preAlertaSeleccionada?.id],
    queryFn: () => prealertaQueries.cajas(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
  });

  const esCajaExistente = cajas.some((c) => c.numero === cajaActual);

  const { data: serialesDeCaja = [] } = useQuery({
    queryKey: ["serialesPorCaja", preAlertaSeleccionada?.id, cajaActual],
    queryFn: () =>
      prealertaQueries.serialesPorCaja(preAlertaSeleccionada!.id!, cajaActual),
    enabled: !!preAlertaSeleccionada?.id && esCajaExistente,
  });

  /* ── SERIALES MOSTRADOS ── */
  // serialesMostrados muestra TODOS (escaneados + DB disponibles sin duplicados)
  const serialesMostrados: SerialItem[] = esCajaExistente
    ? serialesDeCaja.map((s) => ({
        codigo: s.serial,
        origen: "api" as const,
        estado: "Empacado" as const,
        tipo: s.tipo as "Serializable" | "No-serializable",
        cantidad: s.cantidad,
        caja: cajaActual,
      }))
    : [
        ...serialesEscaneados,
        ...serialesDeDB.filter(
          (d) =>
            d.estado === "Disponible" &&
            !serialesEscaneados.some((e) => e.codigo === d.codigo), // sin duplicados
        ),
      ];

  /* ── SINCRONIZAR API ── */
  const { sincronizando, sincronizarDesdeAPI } = useSincronizarAPI({
    serialesEscaneados,
    setSerialEscaneados,
    showToast,
  });

  /* ── FILTRO + ORDEN ── */
  const filteredAndSorted = (() => {
    let list = prealertas.filter((r) =>
      r.nombre.toLowerCase().includes(query.toLowerCase()),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = (a[sortCol] ?? "").toLowerCase();
        const bv = (b[sortCol] ?? "").toLowerCase();
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return list;
  })();

  const handleSort = (col: "nombre" | "fecha") => {
    if (sortCol === col) setSortAsc((p) => !p);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  /* ── HELPER ID ── */
  const resolverIdPrealerta = async (
    item: PrealertaItem,
  ): Promise<number | null> => {
    if (item.id) return item.id;
    const res = await fetch(
      `/api/agente/getId?nombre=${encodeURIComponent(item.nombre)}`,
    );
    if (!res.ok) return null;
    return res.json();
  };

  /* ── MUTATIONS ── */
  const crearMutation = useMutation({
    mutationFn: prealertaMutations.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["prealertas"] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: prealertaMutations.delete,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["prealertas"] }),
  });

  const empacarMutation = useMutation({
    mutationFn: prealertaMutations.empacar,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cajas", preAlertaSeleccionada?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["seriales", preAlertaSeleccionada?.id],
      });
    },
  });

  const desempacarMutation = useMutation({
    mutationFn: ({
      prealertaId,
      seriales,
    }: {
      prealertaId: number;
      seriales: string[];
    }) => prealertaMutations.desempacar(prealertaId, seriales),
    onSuccess: () => {
      const id = preAlertaSeleccionada?.id;
      queryClient.removeQueries({ queryKey: ["cajas", id], exact: false });
      queryClient.removeQueries({ queryKey: ["seriales", id], exact: false });
      queryClient.removeQueries({
        queryKey: ["serialesPorCaja"],
        exact: false,
      });
    },
  });

  const eliminarSerialMutation = useMutation({
    mutationFn: ({
      prealertaId,
      serial,
    }: {
      prealertaId: number;
      serial: string;
    }) => prealertaMutations.eliminarSerial(prealertaId, serial),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["seriales", preAlertaSeleccionada?.id],
      }),
  });

  /* ── HANDLERS ── */
  const handleCrearPrealerta = async (sedeId: number, sedeNombre: string) => {
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario: UsuarioSesion | null = usuarioRaw
      ? JSON.parse(usuarioRaw)
      : null;
    if (!usuario?.id) {
      showToast("No hay sesión activa", "error");
      return;
    }

    try {
      await crearMutation.mutateAsync({
        nombre: `${usuario.nombres} ${usuario.apellidos} - CODIGO - ${sedeNombre}`,
        tipoOrigenId: 13,
        origenId: sedeId,
        guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
        usuarioId: usuario.id,
        idResponsable: usuario.id,
        estado: "Pendiente",
      });
      showToast(`✓ Prealerta creada`);
    } catch {
      showToast("Error al crear la prealerta", "error");
    }
  };

  const handleEliminar = async () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);
    const id = await resolverIdPrealerta(item);
    if (!id) {
      showToast("No se pudo obtener el Id", "error");
      return;
    }
    try {
      await eliminarMutation.mutateAsync(id);
      showToast("✓ Prealerta eliminada");
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleEmpacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }

    const serialesAEmpacar =
      seleccionados.size > 0
        ? serialesMostrados.filter((_, i) => seleccionados.has(i))
        : serialesMostrados;

    const sinDuplicados = serialesAEmpacar.filter(
      (s, i, self) => i === self.findIndex((x) => x.codigo === s.codigo),
    );

    if (sinDuplicados.length === 0) {
      showToast("No hay seriales para empacar", "error");
      return;
    }

    const idPrealerta = await resolverIdPrealerta(preAlertaSeleccionada);
    if (!idPrealerta) {
      showToast("No se pudo obtener el Id", "error");
      return;
    }

    setEmpacando(true);
    setProgreso(0);

    try {
      const { exitosos, yaExistian, fallidos } =
        await empacarMutation.mutateAsync({
          prealertaId: idPrealerta,
          caja: cajaActual,
          seriales: sinDuplicados.map(({ codigo, tipo, mac, cantidad }) => ({
            Serial: codigo,
            Mac: mac ?? "",
            Tipo: tipo ?? "Serializable",
            Cantidad: tipo === "No-serializable" ? (cantidad ?? 1) : 1,
          })),
        });

      setProgreso(100);
      setSeleccionados(new Set());

      if (exitosos > 0) {
        setSerialEscaneados([]); // ← limpia escaneados
        setSeleccionados(new Set());
        setCajaActual((prev) => prev + 1);
        queryClient.removeQueries({
          queryKey: ["seriales", preAlertaSeleccionada?.id],
          exact: false,
        });
        queryClient.removeQueries({
          queryKey: ["cajas", preAlertaSeleccionada?.id],
          exact: false,
        });
        showToast(
          `✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""} en caja ${cajaActual}`,
        );
      }
      if (yaExistian > 0)
        showToast(`⚠ ${yaExistian} ya estaban empacados`, "error");
      if (fallidos > 0)
        showToast(`✗ ${fallidos} no se pudieron insertar`, "error");
    } catch {
      showToast("Error inesperado al empacar", "error");
    } finally {
      setEmpacando(false);
      setProgreso(0);
    }
  };

  const handleDesempacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }

    const aDesempacar =
      seleccionados.size > 0
        ? serialesDeDB.filter((_, i) => seleccionados.has(i)) // ← cambio
        : serialesDeDB; // ← cambio

    const soloEmpacados = aDesempacar.filter(
      (s) => s.estado?.trim().toUpperCase() === "EMPACADO", // ← OJO: toUpperCase → compara EN MAYÚSCULAS
    );

    if (soloEmpacados.length === 0) {
      showToast("No hay seriales empacados", "error");
      return;
    }

    const idPrealerta = await resolverIdPrealerta(preAlertaSeleccionada);
    if (!idPrealerta) {
      showToast("No se pudo obtener el Id", "error");
      return;
    }

    try {
      const data = await desempacarMutation.mutateAsync({
        prealertaId: idPrealerta,
        seriales: soloEmpacados.map((s) => s.codigo),
      });
      if (data.eliminados > 0) {
        setSeleccionados(new Set());
        showToast(
          `✓ ${data.eliminados} serial${data.eliminados !== 1 ? "es" : ""} desempacado${data.eliminados !== 1 ? "s" : ""}`,
        );
      } else {
        showToast("No se eliminaron seriales", "error");
      }
    } catch {
      showToast("Error al desempacar", "error");
    }
  };

  const handleRemoveSerial = async (idx: number) => {
    const serial = serialesEscaneados[idx];
    if (!preAlertaSeleccionada?.id) {
      setSerialEscaneados((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    try {
      const data = await eliminarSerialMutation.mutateAsync({
        prealertaId: preAlertaSeleccionada.id,
        serial: serial.codigo,
      });
      if (data.eliminados > 0) showToast("✓ Serial eliminado");
      else showToast("No se pudo eliminar", "error");
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleSerialConfirm = (seriales: string[]) => {
    setSerialEscaneados((prev) => [
      ...prev,
      ...seriales.map((codigo) => ({ codigo, origen: "manual" as const })),
    ]);
  };

  const handleAgregarSerial = (item: SerialItem) =>
    setSerialEscaneados((prev) => [...prev, item]);

  const handleToggleSerial = (idx: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (seleccionados.size === serialesEscaneados.length)
      setSeleccionados(new Set());
    else setSeleccionados(new Set(serialesEscaneados.map((_, i) => i)));
  };

  const handleActualizarTipo = (tipo: "Serializable" | "No-serializable") => {
    setSerialEscaneados((prev) =>
      prev.map((s, i) => (seleccionados.has(i) ? { ...s, tipo } : s)),
    );
  };

  const empacarAccesoriosAgrupados = async (
    accesorios: Array<{
      codigoAccesorio: string;
      accesorio: string;
      cantidad: number;
    }>,
  ) => {
    setSincronizandoAccesorios(true);
    try {
      const sinAccesorios = serialesEscaneados.filter(
        (s) => s.tipo !== "No-serializable",
      );
      const nuevos: SerialItem[] = accesorios.map((a) => ({
        codigo: a.codigoAccesorio,
        descripcion: a.accesorio,
        cantidad: a.cantidad,
        origen: "api" as const,
        tipo: "No-serializable" as const,
      }));
      setSerialEscaneados([...sinAccesorios, ...nuevos]);
      const total = nuevos.reduce((s, a) => s + (a.cantidad ?? 1), 0);
      showToast(`✓ ${nuevos.length} material(es) · ${total} unidades cargadas`);
    } finally {
      setSincronizandoAccesorios(false);
    }
  };

  return {
    // Estado
    isLoading,
    query,
    setQuery,
    sortCol,
    sortAsc,
    filteredAndSorted,
    scannerOpen,
    setScannerOpen,
    serialesEscaneados,
    serialesMostrados,
    confirmItem,
    setConfirmItem,
    preAlertaSeleccionada,
    setPreAlertaSeleccionada,
    toast,
    empacando,
    progreso,
    sincronizando,
    seleccionados,
    modalSincronizar,
    setModalSincronizar,
    modalAccesorios,
    setModalAccesorios,
    cajaActual,
    setCajaActual,
    cargandoSeriales: false,
    sincronizandoAccesorios,
    cajas,
    serialesDeCaja,
    // Handlers
    handleSort,
    handleCrearPrealerta,
    pedirConfirmacion: (item: PrealertaItem) => setConfirmItem(item),
    handleEliminar,
    handleSerialConfirm,
    handleRemoveSerial,
    handleEmpacar,
    handleDesempacar,
    showToast,
    sincronizarDesdeAPI,
    handleAgregarSerial,
    handleToggleSerial,
    handleToggleAll,
    handleActualizarTipo,
    empacarAccesoriosAgrupados,
  };
}

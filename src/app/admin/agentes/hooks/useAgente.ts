"use client";

import { useState, useEffect } from "react";
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
  const [sedeId, setSedeId] = useState<number | null>(null);
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
  const [serialesPrevista, setSerialePrevista] = useState<SerialItem[]>([]);
  const [guardandoSeriales, setGuardandoSeriales] = useState(false);

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

  const { data: serialesDeDB = [], isFetching: cargandoSeriales } = useQuery({
    queryKey: ["seriales", preAlertaSeleccionada?.id],
    queryFn: () => prealertaQueries.seriales(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
    staleTime: 0,
  });

  const { data: cajas = [] } = useQuery({
    queryKey: ["cajas", preAlertaSeleccionada?.id],
    queryFn: () => prealertaQueries.cajas(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
    staleTime: 0,
  });

  useEffect(() => {
    if (!preAlertaSeleccionada) return;
    const maxCaja =
      cajas.length > 0 ? Math.max(...cajas.map((c) => c.numero)) : 0;
    setCajaActual(maxCaja + 1);
  }, [preAlertaSeleccionada?.id, cajas.length]);

  const esCajaExistente = cajas.some((c) => c.numero === cajaActual);

  const { data: serialesDeCaja = [], isFetching: cargandoCaja } = useQuery({
    queryKey: ["serialesPorCaja", preAlertaSeleccionada?.id, cajaActual],
    queryFn: () =>
      prealertaQueries.serialesPorCaja(preAlertaSeleccionada!.id!, cajaActual),
    enabled: !!preAlertaSeleccionada?.id && esCajaExistente,
    staleTime: 0,
  });

  /* ── SERIALES MOSTRADOS ── */
  // Muestra: seriales ya empacados en la caja seleccionada + escaneados + disponibles sin duplicar.
  const serialesEnCaja: SerialItem[] = esCajaExistente
    ? serialesDeCaja.map((s) => ({
        codigo: s.serial,
        origen: "api" as const,
        estado: "Empacado" as const,
        tipo: s.tipo as "Serializable" | "No-serializable",
        cantidad: s.cantidad,
        caja: cajaActual,
        tramite: s.tramite,
        codigo_sap: s.codigoSap ?? undefined,
        descripcion: s.descripcion ?? undefined,
      }))
    : [];

  const codigosEnCaja = new Set(serialesEnCaja.map((s) => s.codigo));

  const serialesMostrados: SerialItem[] = [
    ...serialesEnCaja,
    ...serialesEscaneados.filter((e) => !codigosEnCaja.has(e.codigo)),
    ...serialesDeDB.filter(
      (d) =>
        d.estado === "Disponible" &&
        !codigosEnCaja.has(d.codigo) &&
        !serialesEscaneados.some((e) => e.codigo === d.codigo),
    ),
  ];

  /* ── SINCRONIZAR API (CRM) ── */
  const { sincronizando, sincronizarDesdeAPI } = useSincronizarAPI({
    serialesEscaneados,
    onPrevista: (seriales) => setSerialePrevista(seriales),
    showToast,
  });

  /* ── ENRIQUECER SERIALES CON SAP (desde API CRM) ── */
  const [sincronizandoSap, setSincronizandoSap] = useState(false);
  const [modalEnriquecerSap, setModalEnriquecerSap] = useState(false);

  /** Abre el modal de fecha/documento para enriquecer los seriales vía CRM */
  const handleSincronizarCodigoSap = () => {
    if (!preAlertaSeleccionada?.id) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    setModalEnriquecerSap(true);
  };

  /** Llamado desde el modal con fecha + documento → consulta CRM y actualiza BD */
  const handleEnriquecerSap = async (fecha: string, documento: string) => {
    if (!preAlertaSeleccionada?.id) return;
    setSincronizandoSap(true);
    try {
      const { actualizados } = await prealertaMutations.enriquecerSeriales(
        preAlertaSeleccionada.id,
        fecha,
        documento || undefined,
      );
      setModalEnriquecerSap(false);
      invalidarCachePrealerta(preAlertaSeleccionada.id);
      if (actualizados === 0) {
        showToast("Ningún serial fue encontrado en la API con código SAP");
      } else {
        showToast(
          `✓ ${actualizados} serial${actualizados !== 1 ? "es" : ""} actualizado${actualizados !== 1 ? "s" : ""} con código SAP`,
        );
      }
    } catch (err) {
      console.error("Error enriqueciendo seriales:", err);
      showToast("Error al buscar seriales en la API", "error");
    } finally {
      setSincronizandoSap(false);
    }
  };

  /* ── FILTRO + ORDEN ── */
  const filteredAndSorted = (() => {
    let list = prealertas.filter(
      (r) =>
        r.nombre.toLowerCase().includes(query.toLowerCase()) &&
        (sedeId === null || r.origenId === sedeId),
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

  const invalidarCachePrealerta = (id: number | undefined) => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: ["seriales", id] });
    queryClient.invalidateQueries({ queryKey: ["cajas", id] });
    queryClient.invalidateQueries({ queryKey: ["serialesPorCaja", id] });
  };

  const empacarMutation = useMutation({
    mutationFn: prealertaMutations.empacar,
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
  });

  const desempacarMutation = useMutation({
    mutationFn: ({
      prealertaId,
      seriales,
    }: {
      prealertaId: number;
      seriales: string[];
    }) => prealertaMutations.desempacar(prealertaId, seriales),
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
  });

  const eliminarSerialMutation = useMutation({
    mutationFn: ({
      prealertaId,
      serial,
    }: {
      prealertaId: number;
      serial: string;
    }) => prealertaMutations.eliminarSerial(prealertaId, serial),
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
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

    const candidatos = serialesMostrados.filter(
      (s) => s.estado !== "Empacado",
    );

    const serialesAEmpacar =
      seleccionados.size > 0
        ? candidatos.filter((s) =>
            seleccionados.has(serialesMostrados.indexOf(s)),
          )
        : candidatos;

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
      const { exitosos, yaExistian, fallidos, enOtraPrealerta } =
        await empacarMutation.mutateAsync({
          prealertaId: idPrealerta,
          caja: cajaActual,
          seriales: sinDuplicados.map(
            ({
              codigo,
              tipo,
              mac,
              cantidad,
              tramite,
              codigo_sap,
              descripcion,
            }) => ({
              Serial: codigo,
              Mac: mac ?? "",
              Tipo: tipo ?? "Serializable",
              Cantidad: tipo === "No-serializable" ? (cantidad ?? 1) : 1,
              Tramite: tramite ?? "Manual",
              CodigoSap: codigo_sap ?? "",
              Descripcion: descripcion ?? "",
            }),
          ),
        });

      setProgreso(100);
      setSeleccionados(new Set());

      if (exitosos > 0) {
        setSerialEscaneados([]);
        setSeleccionados(new Set());
        setCajaActual((prev) => prev + 1);
        showToast(
          `✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""} en caja ${cajaActual}`,
        );
      }
      if (yaExistian > 0)
        showToast(`⚠ ${yaExistian} ya estaban empacados`, "error");
      if (enOtraPrealerta > 0)
        showToast(`✗ ${enOtraPrealerta} serial${enOtraPrealerta !== 1 ? "es" : ""} ya existe${enOtraPrealerta !== 1 ? "n" : ""} en otra prealerta`, "error");
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
        ? serialesMostrados.filter((_, i) => seleccionados.has(i))
        : serialesMostrados;

    const soloEmpacados = aDesempacar.filter(
      (s) => s.estado?.trim().toUpperCase() === "EMPACADO",
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
    const serial = serialesMostrados[idx];
    if (!serial) return;
    const enEscaneados = serialesEscaneados.some(
      (s) => s.codigo === serial.codigo,
    );
    if (enEscaneados || !preAlertaSeleccionada?.id) {
      setSerialEscaneados((prev) =>
        prev.filter((s) => s.codigo !== serial.codigo),
      );
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

  const handleRemoveSeleccionados = async () => {
    const items = serialesMostrados.filter((_, i) => seleccionados.has(i));
    if (items.length === 0) return;

    const enEscaneados = items.filter((s) =>
      serialesEscaneados.some((e) => e.codigo === s.codigo),
    );
    const enDB = items.filter(
      (s) => !serialesEscaneados.some((e) => e.codigo === s.codigo),
    );

    if (enEscaneados.length > 0) {
      const codigos = new Set(enEscaneados.map((s) => s.codigo));
      setSerialEscaneados((prev) => prev.filter((s) => !codigos.has(s.codigo)));
    }

    if (enDB.length > 0 && preAlertaSeleccionada?.id) {
      try {
        await Promise.all(
          enDB.map((s) =>
            eliminarSerialMutation.mutateAsync({
              prealertaId: preAlertaSeleccionada.id!,
              serial: s.codigo,
            }),
          ),
        );
        showToast(
          `✓ ${enDB.length} serial${enDB.length !== 1 ? "es" : ""} eliminado${enDB.length !== 1 ? "s" : ""}`,
        );
      } catch {
        showToast("Error al eliminar", "error");
      }
    }

    setSeleccionados(new Set());
  };

  const handleSerialConfirm = (seriales: string[]) => {
    setSerialEscaneados((prev) => [
      ...prev,
      ...seriales.map((codigo) => ({
        codigo,
        origen: "manual" as const,
        tramite: "Manual",
      })),
    ]);
  };

  const handleAgregarSerial = async (item: SerialItem) => {
    setSerialEscaneados((prev) => [...prev, item]);

    if (!preAlertaSeleccionada?.id) return;

    try {
      const { insertados, yaExistian, enOtraPrealerta, fallidos } =
        await prealertaMutations.guardarDisponible({
          prealertaId: preAlertaSeleccionada.id,
          seriales: [
            {
              serial: item.codigo,
              mac: item.mac,
              codigoSap: item.codigo_sap,
              descripcion: item.descripcion,
              tramite: item.tramite ?? "Manual",
            },
          ],
        });

      invalidarCachePrealerta(preAlertaSeleccionada.id);

      if (insertados > 0)
        showToast(`✓ Serial ${item.codigo} guardado`);
      if (yaExistian > 0)
        showToast(`⚠ ${item.codigo} ya existía en la prealerta`, "error");
      if (enOtraPrealerta > 0)
        showToast(`✗ ${item.codigo} ya está en otra prealerta`, "error");
      if (fallidos > 0)
        showToast(`✗ Error al guardar ${item.codigo}`, "error");
    } catch {
      showToast("Error al guardar el serial en la prealerta", "error");
    }
  };

  const handleGuardarSeriales = async () => {
    if (!preAlertaSeleccionada?.id) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    setGuardandoSeriales(true);
    try {
      const { insertados, yaExistian, enOtraPrealerta, fallidos } =
        await prealertaMutations.guardarDisponible({
          prealertaId: preAlertaSeleccionada.id,
          seriales: serialesPrevista.map(({ codigo, mac, codigo_sap, descripcion, tramite }) => ({
            serial: codigo,
            mac,
            codigoSap: codigo_sap,
            descripcion,
            tramite: tramite ?? "Sincronizado",
          })),
        });

      setSerialePrevista([]);
      setModalSincronizar(false);
      invalidarCachePrealerta(preAlertaSeleccionada.id);

      if (insertados > 0)
        showToast(`✓ ${insertados} serial${insertados !== 1 ? "es" : ""} guardado${insertados !== 1 ? "s" : ""}`);
      if (yaExistian > 0)
        showToast(`⚠ ${yaExistian} ya existían en la prealerta`, "error");
      if (enOtraPrealerta > 0)
        showToast(`✗ ${enOtraPrealerta} ya en otra prealerta`, "error");
      if (fallidos > 0)
        showToast(`✗ ${fallidos} fallaron`, "error");
    } catch {
      showToast("Error al guardar seriales", "error");
    } finally {
      setGuardandoSeriales(false);
    }
  };

  const handleToggleSerial = (idx: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (seleccionados.size === serialesMostrados.length)
      setSeleccionados(new Set());
    else setSeleccionados(new Set(serialesMostrados.map((_, i) => i)));
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
        codigo_sap: a.codigoAccesorio,
        cantidad: a.cantidad,
        origen: "api" as const,
        tipo: "No-serializable" as const,
        tramite: "Sincronizado",
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
    setSedeId,
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
    serialesPrevista,
    limpiarPrevista: () => setSerialePrevista([]),
    guardandoSeriales,
    cajaActual,
    setCajaActual,
    cargandoSeriales: cargandoSeriales || cargandoCaja,
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
    handleRemoveSeleccionados,
    handleEmpacar,
    handleDesempacar,
    showToast,
    sincronizarDesdeAPI,
    handleSincronizarCodigoSap,
    sincronizandoSap,
    modalEnriquecerSap,
    setModalEnriquecerSap,
    handleEnriquecerSap,
    handleGuardarSeriales,
    handleAgregarSerial,
    handleToggleSerial,
    handleToggleAll,
    handleActualizarTipo,
    empacarAccesoriosAgrupados,
  };
}

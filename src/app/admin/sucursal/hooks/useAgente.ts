"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sucursalQueries,
  sucursalMutations,
} from "@/app/services/sucursal.client";
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
    queryKey: ["sucursal-prealertas"],
    queryFn: sucursalQueries.list,
  });

  const { data: serialesDeDB = [], isFetching: cargandoSeriales } = useQuery({
    queryKey: ["sucursal-seriales", preAlertaSeleccionada?.id],
    queryFn: () => sucursalQueries.seriales(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
    staleTime: 0,
  });

  const { data: cajas = [] } = useQuery({
    queryKey: ["sucursal-cajas", preAlertaSeleccionada?.id],
    queryFn: () => sucursalQueries.cajas(preAlertaSeleccionada!.id!),
    enabled: !!preAlertaSeleccionada?.id,
    staleTime: 0,
  });

  useEffect(() => {
    if (!preAlertaSeleccionada) return;
    const maxCaja =
      cajas.length > 0 ? Math.max(...cajas.map((c) => c.numero)) : 0;
    setCajaActual(maxCaja + 1);
  }, [preAlertaSeleccionada?.id, cajas.length]);


  /* ── SERIALES MOSTRADOS ── */
  // Muestra todos los seriales de la prealerta (Empacado + Disponible) sin importar la caja
  const codigosEnDB = new Set(serialesDeDB.map((s) => s.codigo));
  const serialesMostrados: SerialItem[] = [
    ...serialesDeDB,
    ...serialesEscaneados.filter((e) => !codigosEnDB.has(e.codigo)),
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
      `/api/sucursal/getId?nombre=${encodeURIComponent(item.nombre)}`,
    );
    if (!res.ok) return null;
    return res.json();
  };

  /* ── MUTATIONS ── */
  const crearMutation = useMutation({
    mutationFn: sucursalMutations.create,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sucursal-prealertas"] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: sucursalMutations.delete,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sucursal-prealertas"] }),
  });

  const invalidarCachePrealerta = (id: number | undefined) => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: ["sucursal-seriales", id] });
    queryClient.invalidateQueries({ queryKey: ["sucursal-cajas", id] });
    queryClient.invalidateQueries({ queryKey: ["sucursal-serialesPorCaja", id] });
  };

  const empacarMutation = useMutation({
    mutationFn: sucursalMutations.empacar,
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
  });

  const desempacarMutation = useMutation({
    mutationFn: ({
      prealertaId,
      seriales,
    }: {
      prealertaId: number;
      seriales: string[];
    }) => sucursalMutations.desempacar(prealertaId, seriales),
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
  });

  const eliminarSerialMutation = useMutation({
    mutationFn: ({
      prealertaId,
      serial,
    }: {
      prealertaId: number;
      serial: string;
    }) => sucursalMutations.eliminarSerial(prealertaId, serial),
    onSuccess: () => invalidarCachePrealerta(preAlertaSeleccionada?.id),
  });

  /* ── HANDLERS ── */
  const handleCrearPrealerta = async (
    sedeId: number,
    sedeNombre: string,
    nombrePersonalizado?: string,
  ) => {
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario: UsuarioSesion | null = usuarioRaw
      ? JSON.parse(usuarioRaw)
      : null;
    if (!usuario?.id) {
      throw new Error("No hay sesión activa");
    }

    const nombreBase = nombrePersonalizado?.trim()
      ? nombrePersonalizado.trim()
      : `${usuario.nombres} ${usuario.apellidos}`;

    const result = await crearMutation.mutateAsync({
      nombre: nombreBase.slice(0, 50),
      tipoOrigenId: 13,
      origenId: sedeId,
      guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
      usuarioId: usuario.id,
      idResponsable: usuario.id,
      estado: "Pendiente",
    });

    if (result?.id) {
      const nombreFinal = `${nombreBase} - ${result.id} - ${sedeNombre}`.slice(0, 50);
      await fetch("/api/sucursal/updateNombre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.id, nombre: nombreFinal }),
      });
      queryClient.invalidateQueries({ queryKey: ["sucursal-prealertas"] });
    }
  };

  const handleCargarSeriales = (nuevos: SerialItem[]) => {
    setSerialEscaneados((prev) => {
      const existentes = new Set(prev.map((s) => s.codigo));
      const sinDuplicados = nuevos.filter((s) => !existentes.has(s.codigo));
      return [...prev, ...sinDuplicados];
    });
  };

  const handleEmpacarDesdeArchivo = async (
    seriales: SerialItem[],
    caja: number,
  ): Promise<{ exitosos: number; yaExistian: number; fallidos: number }> => {
    if (!preAlertaSeleccionada) throw new Error("Sin prealerta seleccionada");

    const idPrealerta = await resolverIdPrealerta(preAlertaSeleccionada);
    if (!idPrealerta) throw new Error("No se pudo obtener el Id");

    return empacarMutation.mutateAsync({
      prealertaId: idPrealerta,
      caja,
      seriales: seriales.map(({ codigo, tipo, mac, cantidad, tramite, codigo_sap, descripcion }) => ({
        Serial: codigo,
        Mac: mac ?? "",
        Tipo: tipo ?? "Serializable",
        Cantidad: tipo === "No-serializable" ? (cantidad ?? 1) : 1,
        Tramite: tramite ?? "Archivo",
        CodigoSap: codigo_sap ?? "",
        Descripcion: descripcion ?? "",
      })),
    });
  };

  const handleCrearYEmpacarDesdeArchivo = async (
    sedeId: number,
    sedeNombre: string,
    nombre: string,
    serialesItems: SerialItem[],
  ): Promise<void> => {
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario: UsuarioSesion | null = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    if (!usuario?.id) throw new Error("No hay sesión activa");

    const result = await crearMutation.mutateAsync({
      nombre: `${sedeNombre} ${usuario.nombres} ${usuario.apellidos}`.slice(0, 50),
      tipoOrigenId: 13,
      origenId: sedeId,
      guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
      usuarioId: usuario.id,
      idResponsable: usuario.id,
      estado: "Pendiente",
    });

    if (!result?.id) throw new Error("No se pudo crear la prealerta");

    const nombreFinal = `${sedeNombre} ${usuario.nombres} ${usuario.apellidos} - ${result.id}`.slice(0, 50);
    await fetch("/api/sucursal/updateNombre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.id, nombre: nombreFinal }),
    });

    // Agrupar por caja y empacar
    const porCaja = new Map<number, SerialItem[]>();
    for (const item of serialesItems) {
      const caja = item.caja ?? 1;
      const grupo = porCaja.get(caja) ?? [];
      grupo.push(item);
      porCaja.set(caja, grupo);
    }

    for (const [caja, seriales] of porCaja) {
      await empacarMutation.mutateAsync({
        prealertaId: result.id,
        caja,
        seriales: seriales.map(({ codigo, tipo, mac, cantidad, tramite, codigo_sap, descripcion }) => ({
          Serial: codigo,
          Mac: mac ?? "",
          Tipo: tipo ?? "Serializable",
          Cantidad: tipo === "No-serializable" ? (cantidad ?? 1) : 1,
          Tramite: tramite ?? "Archivo",
          CodigoSap: codigo_sap ?? "",
          Descripcion: descripcion ?? "",
        })),
      });
    }

    queryClient.invalidateQueries({ queryKey: ["sucursal-prealertas"] });
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

  const handleSerialConfirm = async (seriales: string[]) => {
    if (!preAlertaSeleccionada?.id) {
      setSerialEscaneados((prev) => [
        ...prev,
        ...seriales.map((codigo) => ({
          codigo,
          origen: "manual" as const,
          tramite: "Manual",
        })),
      ]);
      return;
    }

    // Con prealerta seleccionada, empacar directamente en la caja actual
    try {
      const { exitosos, yaExistian, fallidos, enOtraPrealerta } = await empacarMutation.mutateAsync({
        prealertaId: preAlertaSeleccionada.id,
        caja: cajaActual,
        seriales: seriales.map((codigo) => ({
          Serial: codigo,
          Mac: "",
          Tipo: "Serializable" as const,
          Cantidad: 1,
          Tramite: "Manual",
          CodigoSap: "",
          Descripcion: "",
        })),
      });
      if (exitosos > 0)
        showToast(`✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""} en caja ${cajaActual}`);
      if (yaExistian > 0)
        showToast(`⚠ ${yaExistian} ya estaban empacados`, "error");
      if (enOtraPrealerta > 0)
        showToast(`✗ ${enOtraPrealerta} serial${enOtraPrealerta !== 1 ? "es" : ""} ya existe${enOtraPrealerta !== 1 ? "n" : ""} en otra prealerta`, "error");
      if (fallidos > 0)
        showToast(`✗ ${fallidos} no se pudieron empacar`, "error");
    } catch {
      showToast("Error al empacar los seriales escaneados", "error");
    }
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
    cargandoSeriales,
    sincronizandoAccesorios,
    cajas,
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
    handleAgregarSerial,
    handleToggleSerial,
    handleToggleAll,
    handleActualizarTipo,
    empacarAccesoriosAgrupados,
    handleCargarSeriales,
    handleEmpacarDesdeArchivo,
    handleCrearYEmpacarDesdeArchivo,
  };
}

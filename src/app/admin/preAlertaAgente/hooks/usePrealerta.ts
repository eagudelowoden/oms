"use client";

import { useState, useEffect, useMemo } from "react";

export interface PrealertaItem {
  id?: number;
  nombre: string;
  fecha?: string;
  estado?: string;
  usuarioId?: number;
  usuarioNombre?: string;
  tipoOrigenId?: number;
  origenId?: number;
}

// ← nuevo: cada serial sabe de dónde vino
export interface SerialItem {
  codigo: string;
  origen: "manual" | "api";
  estado?: "Pendiente" | "Empacado";
  tipo?: "Serializable" | "No-serializable";
  mac?: string;
  caja?: number;
  cantidad?: number; // ← NUEVA
  descripcion?: string; // ← NUEVA (para mostrar nombre del accesorio)
}

interface UsuarioSesion {
  id: number;
  nombres: string;
  apellidos: string;
  nombreusuario: string;
  cargo?: string;
  correo?: string;
}

// ── Constantes API WFSM ──
// ── Constantes API WFSM ──
const WFSM_LOGIN_URL = "https://wfsapi.tcpip.tech/api/usuarios/login";
const WFSM_CONSULTA_URL = "https://wfsapi.tcpip.tech/api/consultas/seriales";
const WFSM_CONSULTA_ACCESORIOS_URL =
  "https://wfsapi.tcpip.tech/api/consultas/seriales/accesorios";
const WFSM_AUTH_BASIC = "Basic bXB1bGlkb0B3b2Rlbi5jb20uY286TTFjaDQzbDIwMjAq";

export function usePrealerta() {
  const [prealertas, setPrealertas] = useState<PrealertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<"nombre" | "fecha" | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sincronizandoAccesorios, setSincronizandoAccesorios] = useState(false);
  const [serialesEscaneados, setSerialEscaneados] = useState<SerialItem[]>([]); // ← cambiado a SerialItem[]
  const [confirmItem, setConfirmItem] = useState<PrealertaItem | null>(null);
  const [preAlertaSeleccionada, setPreAlertaSeleccionada] =
    useState<PrealertaItem | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "error";
  } | null>(null);
  const [empacando, setEmpacando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [modalSincronizar, setModalSincronizar] = useState(false);
  const [cajaActual, setCajaActual] = useState<number>(1);
  const [cargandoSeriales, setCargandoSeriales] = useState(false);

  /* ── TOAST ── */
  const showToast = (msg: string, type: "ok" | "error" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── CARGAR HISTORIAL ── */
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/prealerta/list");

        if (!res.ok) throw new Error("Error al obtener datos");
        setPrealertas(await res.json());
      } catch (e) {
        console.error("Fallo al cargar historial:", e);
      } finally {
        setIsLoading(false);
      }
    };
    cargar();
  }, []);

  /* ── FILTRO + ORDEN ── */
  const filteredAndSorted = useMemo(() => {
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
  }, [prealertas, query, sortCol, sortAsc]);

  const handleSort = (col: "nombre" | "fecha") => {
    if (sortCol === col) setSortAsc((p) => !p);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  };
  const handleAgregarSerial = (item: SerialItem) => {
    console.log("➕ serial agregado:", item); // ← agrega
    setSerialEscaneados((prev) => [...prev, item]);
  };
  /* ── CREAR PREALERTA ── */
  // Cambia la firma para recibir los datos de sede
  const handleCrearPrealerta = async (sedeId: number, sedeNombre: string) => {
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario: UsuarioSesion | null = usuarioRaw
      ? JSON.parse(usuarioRaw)
      : null;

    if (!usuario?.id) {
      showToast("No hay sesión activa", "error");
      return;
    }

    const ahora = new Date();

    try {
      const res = await fetch("/api/prealerta/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: `${usuario.nombres} ${usuario.apellidos} - CODIGO - ${sedeNombre}`, // SP reemplaza CODIGO por el ID
          tipoOrigenId: 13,
          origenId: sedeId,
          guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
          usuarioId: usuario.id,
          idResponsable: usuario.id,
          estado: "Pendiente",
        }),
      });

      if (!res.ok) {
        showToast("Error al crear la prealerta", "error");
        return;
      }

      const created = await res.json();
      const idCreado = created?.id;

      // ✅ Nombre con ID real para mostrar en pantalla
      const nombreAuto = `${usuario.nombres} ${usuario.apellidos} - ${idCreado} - ${sedeNombre}`;

      const fechaFormateada = ahora.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "America/Bogota",
      });

      console.log("✅ created:", created);
      setPrealertas((prev) => [
        {
          id: idCreado,
          nombre: nombreAuto,
          fecha: fechaFormateada,
          estado: "Pendiente",
          usuarioId: usuario?.id,
          usuarioNombre: `${usuario?.nombres} ${usuario?.apellidos}`,
          tipoOrigenId: 13,
          origenId: sedeId,
        },
        ...prev,
      ]);

      showToast(`✓ Prealerta creada — ${nombreAuto}`);
    } catch (e) {
      console.error("Error al insertar:", e);
      showToast("Error de conexión", "error");
    }
  };

  const handleDesempacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }

    // Solo desempacar los seleccionados que estén empacados
    const serialesADesempacar =
      seleccionados.size > 0
        ? serialesEscaneados.filter((_, i) => seleccionados.has(i))
        : serialesEscaneados.filter((s) => s.estado === "Empacado");

    const soloEmpacados = serialesADesempacar.filter(
      (s) => s.estado === "Empacado",
    );

    if (soloEmpacados.length === 0) {
      showToast("No hay seriales empacados para desempacar", "error");
      return;
    }

    let idPrealerta = preAlertaSeleccionada.id;
    if (!idPrealerta) {
      const resId = await fetch(
        `/api/prealerta/getId?nombre=${encodeURIComponent(preAlertaSeleccionada.nombre)}`,
      );
      if (resId.ok) idPrealerta = await resId.json();
    }
    if (!idPrealerta) {
      showToast("No se pudo obtener el Id", "error");
      return;
    }

    try {
      const res = await fetch("/api/prealerta/desempacar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prealertaId: idPrealerta,
          seriales: soloEmpacados.map((s) => s.codigo),
        }),
      });

      const data = await res.json();

      if (res.ok && data.eliminados > 0) {
        const codigosDesempacados = new Set(soloEmpacados.map((s) => s.codigo));

        // En lugar de filtrar, actualiza caja a 0 y estado a Pendiente
        setSerialEscaneados((prev) =>
          prev.map((s) =>
            codigosDesempacados.has(s.codigo)
              ? { ...s, estado: "Pendiente", caja: 0 }
              : s,
          ),
        );
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

  // usePrealerta.ts — reemplaza o agrega este efecto
  useEffect(() => {
    if (!preAlertaSeleccionada?.id) {
      setSerialEscaneados([]);
      return;
    }

    const fetchSeriales = async () => {
      setCargandoSeriales(true); // ← inicio
      try {
        const res = await fetch(
          `/api/prealerta/seriales?prealertaId=${preAlertaSeleccionada.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSerialEscaneados(data);
        }
      } catch {
        showToast("Error al cargar seriales", "error");
      } finally {
        setCargandoSeriales(false); // ← fin
      }
    };

    fetchSeriales();
  }, [preAlertaSeleccionada?.id]);

  /* ── ELIMINAR PREALERTA ── */
  const pedirConfirmacion = (item: PrealertaItem) => setConfirmItem(item);

  const handleEliminar = async () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);

    try {
      let idAEliminar = item.id;
      if (!idAEliminar) {
        const resId = await fetch(
          `/api/prealerta/getId?nombre=${encodeURIComponent(item.nombre)}`,
        );
        if (!resId.ok) {
          showToast("No se pudo obtener el Id", "error");
          return;
        }
        idAEliminar = await resId.json();
      }
      if (!idAEliminar) {
        showToast("Prealerta no encontrada", "error");
        return;
      }

      const res = await fetch("/api/prealerta/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idAEliminar }),
      });

      if (res.ok) {
        setPrealertas((prev) => prev.filter((r) => r.nombre !== item.nombre));
        showToast("✓ Prealerta eliminada");
      } else {
        showToast("Error al eliminar", "error");
      }
    } catch (e) {
      console.error("Error al eliminar:", e);
      showToast("Error de conexión", "error");
    }
  };

  /* ── SERIALES manuales ── */
  const handleSerialConfirm = (seriales: string[]) => {
    const nuevos: SerialItem[] = seriales.map((codigo) => ({
      codigo,
      origen: "manual",
    }));
    setSerialEscaneados((prev) => [...prev, ...nuevos]);
  };

  const handleRemoveSerial = async (idx: number) => {
    const serial = serialesEscaneados[idx];

    // Sin prealerta → solo quitar de la vista
    if (!preAlertaSeleccionada?.id) {
      setSerialEscaneados((prev) => prev.filter((_, i) => i !== idx));
      return;
    }

    // Siempre eliminar de BD
    try {
      const res = await fetch("/api/prealerta/eliminarSerial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prealertaId: preAlertaSeleccionada.id,
          serial: serial.codigo,
        }),
      });

      const data = await res.json();

      if (res.ok && data.eliminados > 0) {
        setSerialEscaneados((prev) => prev.filter((_, i) => i !== idx));
        showToast("✓ Serial eliminado");
      } else {
        showToast("No se pudo eliminar", "error");
      }
    } catch {
      showToast("Error al eliminar", "error");
    }
  };
  /* ── SELECCIÓN DE SERIALES ── */
  const handleToggleSerial = (idx: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (seleccionados.size === serialesEscaneados.length) {
      setSeleccionados(new Set()); // deseleccionar todos
    } else {
      setSeleccionados(new Set(serialesEscaneados.map((_, i) => i))); // seleccionar todos
    }
  };

  /* ── SINCRONIZAR DESDE API WFSM ── */
  const sincronizarDesdeAPI = async (
    fechaProceso?: string,
    documento?: string,
  ) => {
    setSincronizando(true);
    try {
      // 1. Login
      const loginRes = await fetch(WFSM_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: WFSM_AUTH_BASIC,
        },
      });
      if (!loginRes.ok) throw new Error(`Login fallido: ${loginRes.status}`);
      const { token } = await loginRes.json();
      if (!token) throw new Error("Token no recibido");

      // 2. Construir rango — la API espera hora Colombia directa (no UTC)
      const hoyCol = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Bogota",
      });
      const fecha = fechaProceso ?? hoyCol;
      // Dia completo en hora Colombia: 00:00:00 a 23:59:59
      const minRecepcion = `${fecha}T00:00:00.000Z`;
      const maxRecepcion = `${fecha}T23:59:59.000Z`;

      // 3. Consulta
      const params = new URLSearchParams({
        "visita/min_recepcion": minRecepcion,
        "visita/max_recepcion": maxRecepcion,
        "conf/timezone": "300",
        "servicio/id_proyecto": "1",
        modelo: "EXPORTACION_SERIALES",
      });

      const consultaRes = await fetch(
        `${WFSM_CONSULTA_URL}?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${token}`,
          },
        },
      );
      if (!consultaRes.ok)
        throw new Error(`Consulta fallida: ${consultaRes.status}`);

      const data = await consultaRes.json();
      const registros: Array<Record<string, unknown>> = data?.registros ?? [];

      // 4. Filtrar por documento_identidad si se proporcionó
      const registrosFiltrados = documento
        ? registros.filter(
            (r) => String(r.documento_identidad ?? "") === documento.trim(),
          )
        : registros;

      // 5. Extraer seriales únicos (no nulos, no ya presentes)
      const codigosExistentes = new Set(
        serialesEscaneados.map((s) => s.codigo),
      );

      const nuevos: SerialItem[] = registrosFiltrados
        .map((r) => r.serial as string)
        .filter((s): s is string => !!s && !codigosExistentes.has(s))
        .map((codigo) => ({ codigo, origen: "api" as const }));

      if (nuevos.length === 0) {
        showToast("Sin seriales nuevos en esa fecha");
      } else {
        setSerialEscaneados((prev) => [...prev, ...nuevos]);
        showToast(
          `✓ ${nuevos.length} serial${nuevos.length !== 1 ? "es" : ""} importado${nuevos.length !== 1 ? "s" : ""} desde API`,
        );
      }
    } catch (err) {
      console.error("Error sincronizando API:", err);
      showToast("Error al sincronizar con la API", "error");
    } finally {
      setSincronizando(false);
    }
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
      const codigosExistentes = new Set(
        serialesEscaneados.map((s) => s.codigo),
      );

      const nuevos: SerialItem[] = accesorios
        .filter((a) => !codigosExistentes.has(a.codigoAccesorio))
        .map((a) => ({
          codigo: a.codigoAccesorio,
          descripcion: a.accesorio,
          cantidad: a.cantidad,
          origen: "api" as const,
          tipo: "No-serializable" as const,
        }));

      if (nuevos.length === 0) {
        showToast("Todos los accesorios ya están cargados");
      } else {
        setSerialEscaneados((prev) => [...prev, ...nuevos]);
        const total = nuevos.reduce((s, a) => s + (a.cantidad ?? 1), 0);
        showToast(
          `✓ ${nuevos.length} material(es) · ${total} unidades importadas`,
        );
      }
    } finally {
      setSincronizandoAccesorios(false);
    }
  };

  const handleActualizarTipo = (tipo: "Serializable" | "No-serializable") => {
    setSerialEscaneados((prev) =>
      prev.map((s, i) => (seleccionados.has(i) ? { ...s, tipo } : s)),
    );
  };

  // Cuando seleccionas una prealerta, obtén la última caja usada
  useEffect(() => {
    if (!preAlertaSeleccionada?.id) return;

    const fetchUltimaCaja = async () => {
      try {
        const res = await fetch(
          `/api/prealerta/ultimaCaja?prealertaId=${preAlertaSeleccionada.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          // Si ya tiene cajas usadas, la siguiente es ultimaCaja + 1
          // Si no tiene ninguna, empieza en 1
          setCajaActual((data.ultimaCaja ?? 0) + 1);
        }
      } catch {
        setCajaActual(1);
      }
    };

    fetchUltimaCaja();
  }, [preAlertaSeleccionada?.id]);

  /* ── EMPACAR ── */

  const handleEmpacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }

    const serialesAEmpacar =
      seleccionados.size > 0
        ? serialesEscaneados.filter((_, i) => seleccionados.has(i))
        : serialesEscaneados;

    const serialesSinDuplicados = serialesAEmpacar.filter(
      (s, index, self) =>
        index === self.findIndex((x) => x.codigo === s.codigo),
    );

    if (serialesSinDuplicados.length === 0) {
      showToast("No hay seriales para empacar", "error");
      return;
    }

    let idPrealerta = preAlertaSeleccionada.id;
    if (!idPrealerta) {
      const resId = await fetch(
        `/api/prealerta/getId?nombre=${encodeURIComponent(preAlertaSeleccionada.nombre)}`,
      );
      if (resId.ok) idPrealerta = await resId.json();
    }
    if (!idPrealerta) {
      showToast("No se pudo obtener el Id", "error");
      return;
    }

    setEmpacando(true);
    setProgreso(0);

    const cajaParaEsteEmpacar = cajaActual;

    try {
      const res = await fetch("/api/prealerta/insertSerialBatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prealertaId: idPrealerta,
          caja: cajaParaEsteEmpacar,
          seriales: serialesSinDuplicados.map(({ codigo, tipo, mac }) => ({
            serial: codigo,
            mac: mac ?? "",
            tipo: tipo ?? "Serializable",
          })),
        }),
      });

      setProgreso(100);

      if (!res.ok) {
        showToast("Error al empacar los seriales", "error");
        return;
      }

      const { exitosos, yaExistian, fallidos } = await res.json();

      const codigosEmpacados = new Set(
        serialesSinDuplicados.map((s) => s.codigo),
      );

      if (exitosos > 0 || yaExistian > 0) {
        setSerialEscaneados((prev) =>
          prev.map((s) =>
            codigosEmpacados.has(s.codigo)
              ? { ...s, estado: "Empacado", caja: cajaParaEsteEmpacar }
              : s,
          ),
        );
        setSeleccionados(new Set());
      }

      // Auto-incrementar caja solo si hubo al menos un insertado nuevo
      if (exitosos > 0) {
        setCajaActual((prev) => prev + 1);
      }

      if (exitosos > 0) {
        showToast(
          `✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""} en caja ${cajaParaEsteEmpacar}`,
        );
      }
      if (yaExistian > 0) {
        showToast(
          `⚠ ${yaExistian} serial${yaExistian !== 1 ? "es" : ""} ya estaba${yaExistian !== 1 ? "n" : ""} empacado${yaExistian !== 1 ? "s" : ""}`,
          "error",
        );
      }
      if (fallidos > 0) {
        showToast(
          `✗ ${fallidos} serial${fallidos !== 1 ? "es" : ""} no se pudo${fallidos !== 1 ? "n" : ""} insertar`,
          "error",
        );
      }
    } catch {
      showToast("Error inesperado al empacar", "error");
    } finally {
      setEmpacando(false);
      setProgreso(0);
    }
  };
  return {
    // estado
    prealertas,
    isLoading,
    query,
    setQuery,
    sortCol,
    sortAsc,
    filteredAndSorted,
    scannerOpen,
    setScannerOpen,
    serialesEscaneados,
    setSerialEscaneados,
    confirmItem,
    setConfirmItem,
    preAlertaSeleccionada,
    setPreAlertaSeleccionada,
    toast,
    empacando,
    progreso,
    sincronizando,
    modalSincronizar,
    setModalSincronizar,
    // acciones
    handleSort,
    handleCrearPrealerta,
    pedirConfirmacion,
    handleEliminar,
    handleSerialConfirm,
    handleRemoveSerial,
    handleEmpacar,
    showToast,
    sincronizarDesdeAPI,
    seleccionados,
    handleToggleSerial,
    handleToggleAll,
    handleAgregarSerial,
    handleActualizarTipo,
    cajaActual,
    setCajaActual,
    handleDesempacar,
    cargandoSeriales,
    sincronizandoAccesorios,
    empacarAccesoriosAgrupados,
  };
}

"use client";

import { useState, useEffect, useMemo } from "react";

export interface PrealertaItem {
  id?: number;
  nombre: string;
  fecha?: string;
  estado?: string;
}

// ← nuevo: cada serial sabe de dónde vino
export interface SerialItem {
  codigo: string;
  origen: "manual" | "api";
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
const WFSM_LOGIN_URL = "https://wfsapi.tcpip.tech/api/usuarios/login";
const WFSM_CONSULTA_URL = "https://wfsapi.tcpip.tech/api/consultas/seriales";
const WFSM_AUTH_BASIC = "Basic bXB1bGlkb0B3b2Rlbi5jb20uY286TTFjaDQzbDIwMjAq";

export function usePrealerta() {
  const [prealertas, setPrealertas] = useState<PrealertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<"nombre" | "fecha" | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
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
    const nombreAuto = `${usuario.nombres} ${usuario.apellidos} - ${sedeNombre}`;

    try {
      const res = await fetch("/api/prealerta/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreAuto,
          tipoOrigenId: 13,
          origenId: sedeId, // <-- usa el id de sede
          guia: `GUIA-${Math.floor(Math.random() * 1000)}`,
          usuarioId: usuario.id,
          idResponsable: usuario.id,
          estado: "Pendiente",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setPrealertas((prev) => [
          {
            id: created?.id ?? undefined,
            nombre: nombreAuto,
            fecha: ahora.toLocaleDateString("es-CO"),
            estado: "Pendiente",
          },
          ...prev,
        ]);
        showToast(`✓ Prealerta creada — ${nombreAuto}`);
      } else {
        showToast("Error al crear la prealerta", "error");
      }
    } catch (e) {
      console.error("Error al insertar:", e);
      showToast("Error de conexión", "error");
    }
  };

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

  const handleRemoveSerial = (idx: number) => {
    setSerialEscaneados((prev) => prev.filter((_, i) => i !== idx));
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

  /* ── EMPACAR ── */
  const handleEmpacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    const serialesAEmpacar =
      seleccionados.size > 0
        ? serialesEscaneados.filter((_, i) => seleccionados.has(i))
        : serialesEscaneados; // si no hay ninguno marcado, empacar todos

    if (serialesAEmpacar.length === 0) {
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

    let exitosos = 0;
    let fallidos = 0;
    const total = serialesAEmpacar.length;

    for (let i = 0; i < total; i++) {
      const { codigo: serial } = serialesAEmpacar[i];
      try {
        const res = await fetch("/api/prealerta/insertSerial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prealertaId: idPrealerta,
            serial,
            mac: "",
            codigoSap: "",
            descripcion: "",
            cantidad: 1,
            caja: 0,
            falla: "",
            tecnicoCliente: "",
            pedido: "",
            tramite: "",
            novedad: "",
            garantia: 0,
          }),
        });
        if (res.ok) exitosos++;
        else fallidos++;
      } catch {
        fallidos++;
      }

      setProgreso(Math.round(((i + 1) / total) * 100));
    }

    setEmpacando(false);
    setProgreso(0);

    if (exitosos > 0) {
      showToast(
        `✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""}`,
      );
      // Quitar solo los seriales que se empacaron
      const codigosEmpacados = new Set(serialesAEmpacar.map((s) => s.codigo));
      setSerialEscaneados((prev) =>
        prev.filter((s) => !codigosEmpacados.has(s.codigo)),
      );
      setSeleccionados(new Set());
    }
    if (fallidos > 0) {
      showToast(
        `${fallidos} serial${fallidos !== 1 ? "es" : ""} no se insertaron`,
        "error",
      );
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
  };
}

"use client";

import { useState, useEffect, useMemo } from "react";

export interface PrealertaItem {
  id?: number;
  nombre: string;
  fecha?: string;
  estado?: string;
}

interface UsuarioSesion {
  id: number;
  nombres: string;
  apellidos: string;
  nombreusuario: string;
  cargo?: string;
  correo?: string;
}

export function usePrealerta() {
  const [prealertas, setPrealertas] = useState<PrealertaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<"nombre" | "fecha" | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [serialesEscaneados, setSerialEscaneados] = useState<string[]>([]);
  const [confirmItem, setConfirmItem] = useState<PrealertaItem | null>(null);
  const [preAlertaSeleccionada, setPreAlertaSeleccionada] =
    useState<PrealertaItem | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "error";
  } | null>(null);

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
  const handleCrearPrealerta = async () => {
    const usuarioRaw = localStorage.getItem("usuario");
    const usuario: UsuarioSesion | null = usuarioRaw
      ? JSON.parse(usuarioRaw)
      : null;

    if (!usuario?.id) {
      showToast("No hay sesión activa", "error");
      return;
    }

    let ciudad = "Sin ubicación";
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          }),
      );
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
      );
      const geoData = await geo.json();
      ciudad =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.municipality ||
        geoData.address?.village ||
        "Sin ciudad";
    } catch (_) {
      ciudad = "Sin ubicación";
    }

    const ahora = new Date();
    const nombreAuto = `${usuario.nombres} ${usuario.apellidos} - ${ciudad}`;

    try {
      const res = await fetch("/api/prealerta/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreAuto,
          tipoOrigenId: 13,
          origenId: 9,
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

  /* ── SERIALES ── */
  const handleSerialConfirm = (seriales: string[]) => {
    setSerialEscaneados((prev) => [...prev, ...seriales]);
  };

  const handleRemoveSerial = (idx: number) => {
    setSerialEscaneados((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ── EMPACAR ── */
  const handleEmpacar = async () => {
    if (!preAlertaSeleccionada) {
      showToast("Selecciona una prealerta primero", "error");
      return;
    }
    if (serialesEscaneados.length === 0) {
      showToast("No hay seriales escaneados", "error");
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

    let exitosos = 0;
    let fallidos = 0;

    for (const serial of serialesEscaneados) {
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
    }

    if (exitosos > 0) {
      showToast(
        `✓ ${exitosos} serial${exitosos !== 1 ? "es" : ""} empacado${exitosos !== 1 ? "s" : ""}`,
      );
      setSerialEscaneados([]);
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
    // acciones
    handleSort,
    handleCrearPrealerta,
    pedirConfirmacion,
    handleEliminar,
    handleSerialConfirm,
    handleRemoveSerial,
    handleEmpacar,
    showToast,
  };
}

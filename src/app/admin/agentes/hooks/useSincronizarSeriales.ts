"use client";

import { useState } from "react";
import { aplicarFiltros } from "../config/sincronizarFiltros.config";
import { SerialItem } from "@/app/models/seriales.models";;

interface UseSincronizarAPIProps {
    serialesEscaneados: SerialItem[];
    onPrevista: (seriales: SerialItem[]) => void;
    showToast: (msg: string, type?: "ok" | "error") => void;
}

export function useSincronizarAPI({
    serialesEscaneados,
    onPrevista,
    showToast,
}: UseSincronizarAPIProps) {
    const [sincronizando, setSincronizando] = useState(false);

    const sincronizarDesdeAPI = async (fechaProceso?: string, documento?: string) => {
        setSincronizando(true);
        try {
            const hoyCol = new Date().toLocaleDateString("en-CA", {
                timeZone: "America/Bogota",
            });
            const fecha = fechaProceso ?? hoyCol;

            const res = await fetch("/api/agente/sincronizarSeriales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fecha, documento }),
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);

            const data = await res.json();
            const registros: Array<Record<string, unknown>> = data?.registros ?? [];
            const registrosFiltradosPorProyecto = aplicarFiltros(registros, 1);
            const registrosFiltrados = documento
                ? registrosFiltradosPorProyecto.filter(
                    (r) => String(r.documento_identidad ?? "") === documento.trim(),
                )
                : registrosFiltradosPorProyecto;

            const codigosExistentes = new Set(serialesEscaneados.map((s) => s.codigo));

            const nuevos: SerialItem[] = registrosFiltrados.reduce<SerialItem[]>((acc, r) => {
                // Usar serial_confirmado si existe, sino serial; descartar si ambos vacíos
                const confirmado = String(r.serial_confirmado ?? "").trim();
                const fallback = String(r.serial ?? "").trim();
                const codigoSerial = confirmado || fallback;
                if (!codigoSerial || codigosExistentes.has(codigoSerial)) return acc;
                const mac = String(r.mac ?? r.imei ?? "").trim() || undefined;
                acc.push({
                    codigo: codigoSerial,
                    mac,
                    codigo_sap: typeof r.codigo_sap === "string" && r.codigo_sap.trim() ? r.codigo_sap.trim() : undefined,
                    descripcion: typeof r.descripcion_sap === "string" && r.descripcion_sap.trim() ? r.descripcion_sap.trim() : undefined,
                    origen: "api" as const,
                    tramite: "Sincronizado",
                });
                return acc;
            }, []);

            if (nuevos.length === 0) {
                showToast("Sin seriales nuevos en esa fecha");
            } else {
                onPrevista(nuevos);
            }
        } catch (err) {
            console.error("Error sincronizando la API:", err);
            showToast("Error al sincronizar con la API", "error");
        } finally {
            setSincronizando(false);
        }
    };

    return { sincronizando, sincronizarDesdeAPI };
}

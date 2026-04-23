"use client";

import { useState } from "react";
import { aplicarFiltros } from "../config/sincronizarFiltros.config";
import { SerialItem } from "@/app/models/seriales.models";;

interface UseSincronizarAPIProps {
    serialesEscaneados: SerialItem[];
    setSerialEscaneados: React.Dispatch<React.SetStateAction<SerialItem[]>>;
    showToast: (msg: string, type?: "ok" | "error") => void;
}

export function useSincronizarAPI({
    serialesEscaneados,
    setSerialEscaneados,
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

            const nuevos: SerialItem[] = registrosFiltrados
                .filter((r) => {
                    const serial = r.serial;
                    return typeof serial === "string" && serial.trim() !== "" && !codigosExistentes.has(serial);
                })
                .map((r) => ({
                    codigo: r.serial as string,
                    codigo_sap: typeof r.codigo_sap === "string" ? r.codigo_sap : undefined,
                    origen: "api" as const,
                    tramite: "Sincronizado",
                }));

            if (nuevos.length === 0) {
                showToast("Sin seriales nuevos en esa fecha");
            } else {
                setSerialEscaneados((prev) => [...prev, ...nuevos]);
                showToast(
                    `✓ ${nuevos.length} serial${nuevos.length !== 1 ? "es" : ""} importado${nuevos.length !== 1 ? "s" : ""} desde la API`,
                );
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
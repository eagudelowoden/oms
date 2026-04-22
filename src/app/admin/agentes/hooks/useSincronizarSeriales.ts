"use client";

import { useState } from "react";
import { aplicarFiltros } from "../config/sincronizarFiltros.config";
import { SerialItem } from "@/app/models/seriales.models";

const WFSM_LOGIN_URL_S = process.env.NEXT_PUBLIC_WFSM_LOGIN_URL_S!;
const WFSM_CONSULTA_URL_SERIALES = process.env.NEXT_PUBLIC_WFSM_CONSULTA_URL_SERIALES!;
const WFSM_AUTH_BASIC_S = process.env.NEXT_PUBLIC_WFSM_AUTH_BASIC_S!;

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
            const loginRes = await fetch(WFSM_LOGIN_URL_S, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: WFSM_AUTH_BASIC_S,
                },
            });
            if (!loginRes.ok) throw new Error(`Login fallido: ${loginRes.status}`);
            const { token } = await loginRes.json();
            if (!token) throw new Error("Token no recibido");

            const hoyCol = new Date().toLocaleDateString("en-CA", {
                timeZone: "America/Bogota",
            });
            const fecha = fechaProceso ?? hoyCol;

            const params = new URLSearchParams({
                "visita/min_recepcion": `${fecha}T00:00:00.000Z`,
                "visita/max_recepcion": `${fecha}T23:59:59.000Z`,
                "conf/timezone": "300",
                "servicio/id_proyecto": "1",
                modelo: "EXPORTACION_SERIALES",
            });

            const consultaRes = await fetch(`${WFSM_CONSULTA_URL_SERIALES}?${params.toString()}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Token ${token}`,
                },
            });
            if (!consultaRes.ok) throw new Error(`Consulta fallida: ${consultaRes.status}`);

            const data = await consultaRes.json();
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
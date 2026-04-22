"use client";
import { useState, useEffect } from "react";
import { AccesorioAgrupado } from "@/app/models/Accesorios.models";

const WFSM_LOGIN_URL = process.env.NEXT_PUBLIC_WFSM_LOGIN_URL!;
const WFSM_CONSULTA_ACCESORIOS_URL = process.env.NEXT_PUBLIC_WFSM_CONSULTA_ACCESORIOS_URL!;
const WFSM_AUTH_BASIC = process.env.NEXT_PUBLIC_WFSM_AUTH_BASIC!;

export function useSincronizarAccesorios(isOpen: boolean) {
    const hoy = new Date().toLocaleDateString("en-CA", {
        timeZone: "America/Bogota",
    });

    const [cedula, setCedula] = useState("");
    const [fecha, setFecha] = useState(hoy);
    const [buscando, setBuscando] = useState(false);
    const [accesorios, setAccesorios] = useState<AccesorioAgrupado[]>([]);
    const [buscado, setBuscado] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isOpen) return;
        setFecha(hoy);
        setBuscado(false);
        setAccesorios([]);
        setError("");
        try {
            const raw = localStorage.getItem("usuario");
            if (raw) {
                const u = JSON.parse(raw);
                const doc =
                    u.documento_identidad ??
                    u.cedula ??
                    u.numeroDocumento ??
                    u.documento ??
                    "";
                setCedula(String(doc));
            }
        } catch (_) { }
    }, [isOpen]);

    const buscar = async () => {
        if (!cedula.trim()) {
            setError("Ingresa un número de cédula");
            return;
        }
        setError("");
        setBuscando(true);
        setAccesorios([]);
        setBuscado(false);

        try {
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

            const params = new URLSearchParams({
                min_fecha: `${fecha}T00:00:00.000Z`,
                max_fecha: `${fecha}T23:59:59.000Z`,
                "conf/timezone": "300",
                "servicio/id_proyecto": "1",
            });

            const consultaRes = await fetch(
                `${WFSM_CONSULTA_ACCESORIOS_URL}?${params.toString()}`,
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

            const filtrados = registros.filter(
                (r) => String(r.documento_identidad ?? "").trim() === cedula.trim(),
            );

            if (filtrados.length === 0) {
                setBuscado(true);
                setAccesorios([]);
                return;
            }

            const mapa = new Map<string, AccesorioAgrupado>();
            for (const r of filtrados) {
                const codigo = String(r.codigo_accesorio ?? "").trim();
                const nombre = String(r.accesorio ?? "").trim();
                if (!codigo) continue;
                const key = `${codigo}||${nombre}`;
                if (mapa.has(key)) {
                    mapa.get(key)!.cantidad += 1;
                } else {
                    mapa.set(key, { codigoAccesorio: codigo, accesorio: nombre, cantidad: 1 });
                }
            }

            setAccesorios(Array.from(mapa.values()));
            setBuscado(true);
        } catch (err) {
            console.error(err);
            setError("Error al consultar la API");
        } finally {
            setBuscando(false);
        }
    };

    const total = accesorios.reduce((s, a) => s + a.cantidad, 0);

    return {
        cedula, setCedula,
        fecha, setFecha,
        buscando,
        accesorios,
        buscado, setBuscado,
        setAccesorios,
        error,
        total,
        buscar,
    };
}
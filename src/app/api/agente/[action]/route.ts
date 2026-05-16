import { NextRequest, NextResponse } from "next/server";
import { AgentesBackendService } from "@/app/services/agente.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === "list") {
      const data = await AgentesBackendService.getListPrealert();
      return NextResponse.json(data);
    }

    if (action === "getId") {
      const nombre = searchParams.get("nombre");
      if (!nombre)
        return NextResponse.json(
          { error: "Nombre requerido" },
          { status: 400 },
        );
      const id = await AgentesBackendService.getIdPrealert(nombre);
      return NextResponse.json(id);
    }

    if (action === "sedes") {
      const data = await AgentesBackendService.getSedes();
      return NextResponse.json(data);
    }

    if (action === "codigosSap") {
      const data = await AgentesBackendService.getCodigosSapList();
      return NextResponse.json(data);
    }

    if (action === "seriales") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json(
          { error: "prealertaId requerido" },
          { status: 400 },
        );
      const data =
        await AgentesBackendService.getSerialsByPrealerta(prealertaId);
      return NextResponse.json(data);
    }

    if (action === "ultimaCaja") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json(
          { error: "prealertaId requerido" },
          { status: 400 },
        );
      const ultimaCaja = await AgentesBackendService.getUltimaCaja(prealertaId);
      return NextResponse.json({ ultimaCaja });
    }

    // ── NUEVO: listado de cajas agrupadas ──
    if (action === "cajas") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json(
          { error: "prealertaId requerido" },
          { status: 400 },
        );
      const cajas =
        await AgentesBackendService.getCajasByPrealerta(prealertaId);
      return NextResponse.json({ cajas });
    }

    // ── NUEVO: seriales de una caja específica ──
    if (action === "serialesPorCaja") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      const caja = parseInt(searchParams.get("caja") ?? "0");
      if (!prealertaId || !caja)
        return NextResponse.json(
          { error: "prealertaId y caja son requeridos" },
          { status: 400 },
        );
      const seriales = await AgentesBackendService.getSerialsPorCaja(
        prealertaId,
        caja,
      );
      return NextResponse.json(seriales);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/agente/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: "Error en servidor", action, detail, stack },
      { status: 500 },
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (action === "sincronizarSeriales") {
    try {
      const body = await request.json();
      const { fecha, documento } = body as { fecha: string; documento?: string };

      const LOGIN_URL = process.env.WFSM_LOGIN_URL!;
      const AUTH_BASIC = process.env.WFSM_AUTH_BASIC!;
      const CONSULTA_URL = process.env.WFSM_CONSULTA_SERIALES_URL!;

      const loginRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: AUTH_BASIC },
      });
      if (!loginRes.ok) return NextResponse.json({ error: "Login fallido" }, { status: 502 });
      const { token } = await loginRes.json();
      if (!token) return NextResponse.json({ error: "Token no recibido" }, { status: 502 });

      const [sy, sm, sd] = fecha.split("-").map(Number);
      const sNextDay = new Date(Date.UTC(sy, sm - 1, sd + 1)).toISOString().split("T")[0];

      const params = new URLSearchParams({
        "visita/min_recepcion": `${fecha}T00:00:00.000Z`,
        "visita/max_recepcion": `${sNextDay}T04:59:59.000Z`,
        "conf/timezone": "300",
        "servicio/id_proyecto": "1",
        modelo: "EXPORTACION_SERIALES",
      });
      if (documento) params.set("documento_identidad", documento);

      const consultaRes = await fetch(`${CONSULTA_URL}?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Token ${token}` },
      });
      if (!consultaRes.ok) return NextResponse.json({ error: "Consulta fallida" }, { status: 502 });

      const data = await consultaRes.json();
      const registros: Array<Record<string, unknown>> = data?.registros ?? [];

      const sapMap = await AgentesBackendService.getCodigosSap();
      const enriched = registros.map((r) => {
        const sap = typeof r.codigo_sap === "string" ? r.codigo_sap.trim() : "";
        return {
          ...r,
          codigo_sap: sap || null,
          descripcion_sap: sap ? (sapMap.get(sap) ?? null) : null,
        };
      });

      return NextResponse.json({ ...data, registros: enriched });
    } catch (error) {
      console.error("Error sincronizarSeriales:", error);
      return NextResponse.json({ error: "Error al sincronizar seriales" }, { status: 500 });
    }
  }

  if (action === "sincronizarAccesorios") {
    try {
      const body = await request.json();
      const { fecha } = body as { fecha: string };

      const LOGIN_URL = process.env.WFSM_LOGIN_URL!;
      const AUTH_BASIC = process.env.WFSM_AUTH_BASIC!;
      const CONSULTA_URL = process.env.WFSM_CONSULTA_ACCESORIOS_URL!;

      const loginRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: AUTH_BASIC },
      });
      if (!loginRes.ok) return NextResponse.json({ error: "Login fallido" }, { status: 502 });
      const { token } = await loginRes.json();
      if (!token) return NextResponse.json({ error: "Token no recibido" }, { status: 502 });

      const params = new URLSearchParams({
        min_fecha: `${fecha}T00:00:00.000Z`,
        max_fecha: `${fecha}T23:59:59.000Z`,
        "conf/timezone": "300",
        "servicio/id_proyecto": "1",
      });

      const consultaRes = await fetch(`${CONSULTA_URL}?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Token ${token}` },
      });
      if (!consultaRes.ok) return NextResponse.json({ error: "Consulta fallida" }, { status: 502 });

      const data = await consultaRes.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error sincronizarAccesorios:", error);
      return NextResponse.json({ error: "Error al sincronizar accesorios" }, { status: 500 });
    }
  }

  if (action === "guardarDisponible") {
    try {
      const body = await request.json();
      const { prealertaId, seriales } = body as {
        prealertaId: number;
        seriales: Array<{ serial: string; codigoSap?: string; descripcion?: string; tramite?: string }>;
      };
      if (!prealertaId || !Array.isArray(seriales)) {
        return NextResponse.json({ error: "prealertaId y seriales son requeridos" }, { status: 400 });
      }
      const result = await AgentesBackendService.guardarSerialesDisponible({ prealertaId, seriales });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error al guardar seriales disponibles:", error);
      return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }
  }

  if (action === "create") {
    try {
      const body = await request.json();
      const result = await AgentesBackendService.insertPrealert({
        Nombre: body.nombre,
        TipoOrigenId: body.tipoOrigenId,
        OrigenId: body.origenId,
        Guia: body.guia,
        UsuarioId: body.usuarioId,
        IdResponsable: body.idResponsable,
        Estado: body.estado,
      });
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error al crear prealerta:", error);
      return NextResponse.json({ error: "Error al insertar" }, { status: 500 });
    }
  }

  if (action === "updateNombre") {
    try {
      const body = await request.json();
      await AgentesBackendService.updatePrealertNombre(body.id, body.nombre);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error al actualizar nombre:", error);
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
  }

  if (action === "insertSerialBatch") {
    try {
      const body = await request.json();
      const result =
        await AgentesBackendService.insertPrealertSerialBatch(body);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error al insertar serial:", error);
      return NextResponse.json(
        { error: "Error al insertar serial" },
        { status: 500 },
      );
    }
  }

  if (action === "desempacar") {
    try {
      const body = await request.json();
      const { prealertaId, seriales } = body;
      if (!prealertaId || !seriales?.length) {
        return NextResponse.json(
          { error: "prealertaId y seriales son requeridos" },
          { status: 400 },
        );
      }
      const eliminados = await AgentesBackendService.desempacarSeriales(
        prealertaId,
        seriales,
      );
      return NextResponse.json({ success: true, eliminados });
    } catch (error) {
      console.error("Error al desempacar:", error);
      return NextResponse.json(
        { error: "Error al desempacar seriales" },
        { status: 500 },
      );
    }
  }

  if (action === "eliminarSerial") {
    try {
      const body = await request.json();
      const { prealertaId, serial } = body;
      if (!prealertaId || !serial) {
        return NextResponse.json(
          { error: "prealertaId y serial son requeridos" },
          { status: 400 },
        );
      }
      const eliminados = await AgentesBackendService.eliminarSerial(
        prealertaId,
        serial,
      );
      return NextResponse.json({ success: true, eliminados });
    } catch {
      return NextResponse.json(
        { error: "Error al eliminar serial" },
        { status: 500 },
      );
    }
  }

  if (action === "enriquecerSeriales") {
    try {
      const body = await request.json();
      const { prealertaId, fecha, documento } = body as {
        prealertaId: number;
        fecha: string;
        documento?: string;
      };
      if (!prealertaId || !fecha)
        return NextResponse.json(
          { error: "prealertaId y fecha son requeridos" },
          { status: 400 },
        );

      // 1. Obtener seriales sin SAP de la BD
      const seriales = await AgentesBackendService.getSerialsSinSap(
        Number(prealertaId),
      );
      console.log(`[enriquecerSeriales] prealertaId=${prealertaId} | seriales sin SAP en BD: ${seriales.length}`, seriales.map(s => s.Serial));
      if (seriales.length === 0)
        return NextResponse.json({ actualizados: 0, debug: "Sin seriales sin SAP en BD" });

      // 2. Login al CRM
      const LOGIN_URL = process.env.WFSM_LOGIN_URL!;
      const AUTH_BASIC = process.env.WFSM_AUTH_BASIC!;
      const CONSULTA_URL = process.env.WFSM_CONSULTA_SERIALES_URL!;

      const loginRes = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: AUTH_BASIC,
        },
      });
      if (!loginRes.ok)
        return NextResponse.json({ error: "Login CRM fallido" }, { status: 502 });
      const { token } = await loginRes.json();
      if (!token)
        return NextResponse.json(
          { error: "Token no recibido" },
          { status: 502 },
        );

      // 3. Consultar CRM por fecha
      // Colombia es UTC-5: el final del día en Colombia (23:59) equivale a 04:59 UTC del día siguiente.
      // Por eso el max_recepcion usa el día siguiente a las 04:59:59Z para capturar registros nocturnos.
      const [y, m, d] = fecha.split("-").map(Number);
      const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
      const nextDayStr = nextDay.toISOString().split("T")[0]; // "YYYY-MM-DD" siguiente

      const qParams = new URLSearchParams({
        "visita/min_recepcion": `${fecha}T00:00:00.000Z`,
        "visita/max_recepcion": `${nextDayStr}T04:59:59.000Z`,
        "conf/timezone": "300",
        "servicio/id_proyecto": "1",
        modelo: "EXPORTACION_SERIALES",
      });
      if (documento) qParams.set("documento_identidad", documento);
      console.log(`[enriquecerSeriales] Rango CRM: ${fecha}T00:00:00.000Z → ${nextDayStr}T04:59:59.000Z (cubre día completo Colombia UTC-5)`);

      const consultaRes = await fetch(`${CONSULTA_URL}?${qParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${token}`,
        },
      });
      if (!consultaRes.ok)
        return NextResponse.json(
          { error: "Consulta CRM fallida" },
          { status: 502 },
        );

      const data = await consultaRes.json();
      const registros: Array<Record<string, unknown>> = data?.registros ?? [];
      console.log(`[enriquecerSeriales] Registros CRM recibidos: ${registros.length}`);
      console.log(`[enriquecerSeriales] Primeros 5 seriales CRM:`, registros.slice(0, 5).map(r => ({ serial: r.serial, serial_confirmado: r.serial_confirmado, codigo_sap: r.codigo_sap })));

      // 4. Construir mapa serial (uppercase) → { codigoSap, descripcionCrm }
      const crmMap = new Map<
        string,
        { codigoSap: string; descripcionCrm: string }
      >();
      for (const r of registros) {
        const sap =
          typeof r.codigo_sap === "string" ? r.codigo_sap.trim() : "";
        if (!sap) continue;
        const desc =
          typeof r.nombre_material === "string"
            ? r.nombre_material.trim()
            : "";
        const entry = { codigoSap: sap, descripcionCrm: desc };
        if (typeof r.serial === "string" && r.serial.trim()) {
          crmMap.set(r.serial.trim().toUpperCase(), entry);
        }
        if (
          typeof r.serial_confirmado === "string" &&
          r.serial_confirmado.trim()
        ) {
          crmMap.set(r.serial_confirmado.trim().toUpperCase(), entry);
        }
      }

      // 5. Descripción local desde tabla CodigoSap (prioridad sobre CRM)
      const sapMap = await AgentesBackendService.getCodigosSap();

      console.log(`[enriquecerSeriales] crmMap construido con ${crmMap.size} entradas`);

      // DEBUG: buscar cada serial de BD en TODOS los registros CRM (con y sin SAP)
      for (const row of seriales) {
        const key = row.Serial.trim().toUpperCase();
        const coincidencias = registros.filter(r =>
          (typeof r.serial === "string" && r.serial.trim().toUpperCase() === key) ||
          (typeof r.serial_confirmado === "string" && r.serial_confirmado.trim().toUpperCase() === key)
        );
        console.log(`[DEBUG] Serial "${key}" aparece ${coincidencias.length} veces en CRM (sin filtro SAP):`,
          coincidencias.map(r => ({ serial: r.serial, serial_confirmado: r.serial_confirmado, codigo_sap: r.codigo_sap, estatus: r.estatus }))
        );
      }

      console.log(`[enriquecerSeriales] Seriales BD a cruzar:`, seriales.map(s => s.Serial.trim().toUpperCase()));

      // 6. Actualizar cada serial encontrado
      let actualizados = 0;
      for (const row of seriales) {
        const key = row.Serial.trim().toUpperCase();
        const found = crmMap.get(key);
        console.log(`[enriquecerSeriales] Buscando serial "${key}" en CRM → ${found ? `ENCONTRADO (sap=${found.codigoSap})` : "NO encontrado"}`);
        if (!found) continue;
        const desc = sapMap.get(found.codigoSap) ?? found.descripcionCrm;
        await AgentesBackendService.actualizarCodigoSapSerial(
          row.Id,
          found.codigoSap,
          desc,
        );
        actualizados++;
      }

      return NextResponse.json({
        actualizados,
        debug: {
          serialesBD: seriales.map(s => s.Serial),
          registrosCRM: registros.length,
          crmMapSize: crmMap.size,
        },
      });
    } catch (error) {
      console.error("Error al enriquecer seriales:", error);
      return NextResponse.json(
        { error: "Error al enriquecer seriales" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Id requerido" }, { status: 400 });
    await AgentesBackendService.deletePrealert(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar prealerta:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

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

      const params = new URLSearchParams({
        "visita/min_recepcion": `${fecha}T00:00:00.000Z`,
        "visita/max_recepcion": `${fecha}T23:59:59.000Z`,
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

  if (action === "create") {
    try {
      const body = await request.json();
      const result = await AgentesBackendService.insertPrealert(body);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: "Error al insertar" }, { status: 500 });
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

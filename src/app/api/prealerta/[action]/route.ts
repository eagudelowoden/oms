import { NextRequest, NextResponse } from "next/server";
import { PrealertaBackendService } from "@/modules/prealerta/services/prealerta.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === "list") {
      const data = await PrealertaBackendService.getListPrealert();
      return NextResponse.json(data);
    }

    if (action === "getId") {
      const nombre = searchParams.get("nombre");
      if (!nombre)
        return NextResponse.json(
          { error: "Nombre requerido" },
          { status: 400 },
        );
      const id = await PrealertaBackendService.getIdPrealert(nombre);
      return NextResponse.json(id);
    }

    if (action === "sedes") {
      const data = await PrealertaBackendService.getSedes();
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
        await PrealertaBackendService.getSerialsByPrealerta(prealertaId);
      return NextResponse.json(data);
    }

    if (action === "ultimaCaja") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json(
          { error: "prealertaId requerido" },
          { status: 400 },
        );
      const ultimaCaja =
        await PrealertaBackendService.getUltimaCaja(prealertaId);
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
        await PrealertaBackendService.getCajasByPrealerta(prealertaId);
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
      const seriales = await PrealertaBackendService.getSerialsPorCaja(
        prealertaId,
        caja,
      );
      return NextResponse.json(seriales);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Error en servidor" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (action === "create") {
    try {
      const body = await request.json();
      const result = await PrealertaBackendService.insertPrealert(body);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: "Error al insertar" }, { status: 500 });
    }
  }

  if (action === "insertSerialBatch") {
    try {
      const body = await request.json();
      const result =
        await PrealertaBackendService.insertPrealertSerialBatch(body);
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
      const eliminados = await PrealertaBackendService.desempacarSeriales(
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
      const eliminados = await PrealertaBackendService.eliminarSerial(
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
    await PrealertaBackendService.deletePrealert(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar prealerta:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

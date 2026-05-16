import { NextRequest, NextResponse } from "next/server";
import { SucursalBackendService } from "@/app/services/sucursal.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === "list") {
      const data = await SucursalBackendService.getListPrealert();
      return NextResponse.json(data);
    }

    if (action === "getId") {
      const nombre = searchParams.get("nombre");
      if (!nombre)
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
      const id = await SucursalBackendService.getIdPrealert(nombre);
      return NextResponse.json(id);
    }

    if (action === "sedes") {
      const data = await SucursalBackendService.getSedes();
      return NextResponse.json(data);
    }

    if (action === "seriales") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const data = await SucursalBackendService.getSerialsByPrealerta(prealertaId);
      return NextResponse.json(data);
    }

    if (action === "cajas") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const cajas = await SucursalBackendService.getCajasByPrealerta(prealertaId);
      return NextResponse.json({ cajas });
    }

    if (action === "serialesPorCaja") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      const caja = parseInt(searchParams.get("caja") ?? "0");
      if (!prealertaId || !caja)
        return NextResponse.json({ error: "prealertaId y caja son requeridos" }, { status: 400 });
      const seriales = await SucursalBackendService.getSerialsPorCaja(prealertaId, caja);
      return NextResponse.json(seriales);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/sucursal/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  try {
    if (action === "create") {
      const body = await request.json();
      const result = await SucursalBackendService.insertPrealert({
        Nombre: body.nombre,
        TipoOrigenId: body.tipoOrigenId,
        OrigenId: body.origenId,
        Guia: body.guia,
        UsuarioId: body.usuarioId,
        IdResponsable: body.idResponsable,
        Estado: body.estado,
      });
      return NextResponse.json(result);
    }

    if (action === "updateNombre") {
      const body = await request.json();
      await SucursalBackendService.updatePrealertNombre(body.id, body.nombre);
      return NextResponse.json({ success: true });
    }

    if (action === "insertSerialBatch") {
      const body = await request.json();
      const result = await SucursalBackendService.insertPrealertSerialBatch(body);
      return NextResponse.json(result);
    }

    if (action === "desempacar") {
      const body = await request.json();
      const { prealertaId, seriales } = body;
      if (!prealertaId || !seriales?.length)
        return NextResponse.json({ error: "prealertaId y seriales son requeridos" }, { status: 400 });
      const eliminados = await SucursalBackendService.desempacarSeriales(prealertaId, seriales);
      return NextResponse.json({ success: true, eliminados });
    }

    if (action === "eliminarSerial") {
      const body = await request.json();
      const { prealertaId, serial } = body;
      if (!prealertaId || !serial)
        return NextResponse.json({ error: "prealertaId y serial son requeridos" }, { status: 400 });
      const eliminados = await SucursalBackendService.eliminarSerial(prealertaId, serial);
      return NextResponse.json({ success: true, eliminados });
    }

    if (action === "sincronizarCodigoSap") {
      const body = await request.json();
      const { prealertaId } = body;
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const result = await SucursalBackendService.sincronizarConCodigoSap(Number(prealertaId));
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ POST /api/sucursal/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ error: "Id requerido" }, { status: 400 });
    await SucursalBackendService.deletePrealert(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ DELETE /api/sucursal error:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

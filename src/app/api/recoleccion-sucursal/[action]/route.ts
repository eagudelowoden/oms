import { NextResponse } from "next/server";
import { RecoleccionSucursalService } from "@/app/services/recoleccion-sucursal.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === "prealertas") {
      const data = await RecoleccionSucursalService.getPrealertas();
      return NextResponse.json(data);
    }

    if (action === "seriales") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const data = await RecoleccionSucursalService.getSeriales(prealertaId);
      return NextResponse.json(data);
    }

    if (action === "accesorios") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const data = await RecoleccionSucursalService.getAccesorios(prealertaId);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", detail }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  try {
    const body = await request.json();

    if (action === "escanear") {
      const { prealertaId, serial } = body;
      if (!prealertaId || !serial)
        return NextResponse.json({ error: "prealertaId y serial requeridos" }, { status: 400 });
      const result = await RecoleccionSucursalService.escanearSerial(prealertaId, serial);
      return NextResponse.json(result);
    }

    if (action === "cerrarVerificacion") {
      const { prealertaId } = body;
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const result = await RecoleccionSucursalService.cerrarVerificacion(prealertaId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", detail }, { status: 500 });
  }
}

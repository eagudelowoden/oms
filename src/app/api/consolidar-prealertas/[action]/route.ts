import { NextResponse } from "next/server";
import { ConsolidarPrealertasService } from "@/app/services/consolidar-prealertas.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(request.url);

  try {
    if (action === "list") {
      const data = await ConsolidarPrealertasService.getPrealertas();
      return NextResponse.json(data);
    }

    if (action === "materiales") {
      const idsParam = searchParams.get("ids") ?? "";
      const ids = idsParam
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
      const data = await ConsolidarPrealertasService.getMateriales(ids);
      return NextResponse.json(data);
    }

    if (action === "accesorios") {
      const idsParam = searchParams.get("ids") ?? "";
      const ids = idsParam
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0);
      const data = await ConsolidarPrealertasService.getAccesorios(ids);
      return NextResponse.json(data);
    }

    if (action === "consolidadas") {
      const data = await ConsolidarPrealertasService.getConsolidadas();
      return NextResponse.json(data);
    }

    if (action === "seriales-descarga") {
      const id = Number(searchParams.get("id"));
      if (!id || isNaN(id))
        return NextResponse.json({ error: "id requerido" }, { status: 400 });
      const data = await ConsolidarPrealertasService.getSerialesDescarga(id);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/consolidar-prealertas/${action} error:`, error);
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
    if (action === "consolidar") {
      const body = await request.json();
      const { ids, usuarioId } = body as { ids: number[]; usuarioId: number };

      if (!ids || ids.length < 2)
        return NextResponse.json(
          { error: "Se necesitan al menos 2 prealertas para consolidar" },
          { status: 400 },
        );

      if (!usuarioId)
        return NextResponse.json({ error: "usuarioId requerido" }, { status: 400 });

      const result = await ConsolidarPrealertasService.consolidar(ids, usuarioId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ POST /api/consolidar-prealertas/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

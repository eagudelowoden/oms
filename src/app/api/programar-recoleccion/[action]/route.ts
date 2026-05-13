import { NextResponse } from "next/server";
import { ProgramarRecoleccionService } from "@/app/services/programar-recoleccion.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const { searchParams } = new URL(_request.url);

  try {
    if (action === "list") {
      const data = await ProgramarRecoleccionService.getListPrealertas();
      return NextResponse.json(data);
    }

    if (action === "materiales") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const data = await ProgramarRecoleccionService.getMateriales(prealertaId);
      return NextResponse.json(data);
    }

    if (action === "verificarEmpacado") {
      const prealertaId = parseInt(searchParams.get("prealertaId") ?? "0");
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const empacado = await ProgramarRecoleccionService.verificarEmpacado(prealertaId);
      return NextResponse.json({ empacado });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/programar-recoleccion/${action} error:`, error);
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
    const body = await request.json();

    if (action === "programar") {
      const { prealertaId, fecha } = body;
      if (!prealertaId || !fecha)
        return NextResponse.json({ error: "prealertaId y fecha requeridos" }, { status: 400 });

      const todoEmpacado = await ProgramarRecoleccionService.verificarEmpacado(prealertaId);
      if (!todoEmpacado)
        return NextResponse.json(
          { error: "Todos los materiales deben estar empacados antes de programar" },
          { status: 422 },
        );

      const result = await ProgramarRecoleccionService.programar(prealertaId, fecha);
      return NextResponse.json(result);
    }

    if (action === "desprogramar") {
      const { prealertaId } = body;
      if (!prealertaId)
        return NextResponse.json({ error: "prealertaId requerido" }, { status: 400 });
      const result = await ProgramarRecoleccionService.desprogramar(prealertaId);
      return NextResponse.json(result);
    }

    if (action === "autorizar") {
      const { prealertaId, noAutorizacion } = body;
      if (!prealertaId || !noAutorizacion)
        return NextResponse.json(
          { error: "prealertaId y noAutorizacion requeridos" },
          { status: 400 },
        );
      const result = await ProgramarRecoleccionService.autorizar(prealertaId, noAutorizacion);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ POST /api/programar-recoleccion/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

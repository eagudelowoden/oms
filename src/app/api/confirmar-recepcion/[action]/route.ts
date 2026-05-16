import { NextResponse } from "next/server";
import { ConfirmarRecepcionService } from "@/app/services/confirmar-recepcion.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  try {
    if (action === "list") {
      const data = await ConfirmarRecepcionService.getPrealertas();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/confirmar-recepcion/${action} error:`, error);
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
    if (action === "confirmar") {
      const body = await request.json();
      const { id } = body as { id: number };
      if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
      await ConfirmarRecepcionService.confirmarRecepcion(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ POST /api/confirmar-recepcion/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

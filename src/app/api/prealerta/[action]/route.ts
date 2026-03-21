import { NextRequest, NextResponse } from "next/server";
import { PrealertaBackendService } from "../../../_modulos/auth/prealerta/services/prealerta.service";

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

  // ── CREAR PREALERTA ──
  if (action === "create") {
    try {
      const body = await request.json();
      const result = await PrealertaBackendService.insertPrealert(body);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: "Error al insertar" }, { status: 500 });
    }
  }

  // ── INSERTAR SERIAL ──
  if (action === "insertSerial") {
    try {
      const body = await request.json();
      const result = await PrealertaBackendService.insertPrealertSerial(body);
      return NextResponse.json(result);
    } catch (error) {
      console.error("Error al insertar serial:", error);
      return NextResponse.json(
        { error: "Error al insertar serial" },
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

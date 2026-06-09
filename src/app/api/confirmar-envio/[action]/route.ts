import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ConfirmarEnvioService } from "@/app/services/confirmar-envio.service";

interface JWTPayload {
  clientId?: number;
  dbName?: string;
  clienteNombre?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "oms_default_secret_2026";

async function getClientIdFromToken(): Promise<number> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) throw new Error("No autenticado");
  const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
  if (!decoded?.clientId) throw new Error("Token sin clientId");
  return decoded.clientId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  try {
    if (action === "list") {
      let validaReco = 0;
      try {
        const clientId = await getClientIdFromToken();
        console.log(`[confirmar-envio/list] clientId=${clientId}`);
        validaReco = await ConfirmarEnvioService.getValidaReco(clientId);
        console.log(`[confirmar-envio/list] validaReco=${validaReco}`);
      } catch (err) {
        console.warn("[confirmar-envio/list] No se pudo obtener validaReco, usando 0:", err);
      }
      const data = await ConfirmarEnvioService.getPrealertas(validaReco);
      console.log(`[confirmar-envio/list] Enviando ${data.length} prealertas`);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ GET /api/confirmar-envio/${action} error:`, error);
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
      await ConfirmarEnvioService.confirmarEnvio(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 404 });
  } catch (error) {
    console.error(`❌ POST /api/confirmar-envio/${action} error:`, error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Error en servidor", action, detail }, { status: 500 });
  }
}

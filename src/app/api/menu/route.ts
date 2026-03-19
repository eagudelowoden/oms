import { NextRequest, NextResponse } from "next/server";
import { MenuService } from "../../_modulos/auth/services/menu.service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idPerfil = searchParams.get("idPerfil");
    const id = searchParams.get("id") ?? "0";

    if (!idPerfil) {
      return NextResponse.json({ error: "Falta idPerfil" }, { status: 400 });
    }

    const items = await MenuService.getMenuByPerfilAndPadre(
      parseInt(idPerfil),
      id,
    );
    return NextResponse.json(items);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

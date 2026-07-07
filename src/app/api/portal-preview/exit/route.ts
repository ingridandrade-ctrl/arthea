import { NextRequest, NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/portal-viewer";

// GET /api/portal-preview/exit?to=/clientes — sai do modo preview.
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") || "/clientes";
  // Só permite destino interno
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/clientes";
  // Cookie limpo na própria resposta de redirect (mesmo motivo do set).
  const res = NextResponse.redirect(new URL(safe, req.url));
  res.cookies.delete(PREVIEW_COOKIE);
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PREVIEW_COOKIE } from "@/lib/portal-viewer";

// GET /api/portal-preview/exit?to=/clientes — sai do modo preview.
export async function GET(req: NextRequest) {
  cookies().delete(PREVIEW_COOKIE);
  const to = req.nextUrl.searchParams.get("to") || "/clientes";
  // Só permite destino interno
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/clientes";
  return NextResponse.redirect(new URL(safe, req.url));
}

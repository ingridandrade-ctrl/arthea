import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PREVIEW_COOKIE } from "@/lib/portal-viewer";

// GET /api/portal-preview?engagementId=X
// Admin/Manager: liga o preview "ver como o cliente" e cai direto na área de
// membros daquele projeto. O cookie expira sozinho em 2h.
export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    return NextResponse.redirect(new URL("/inicio", req.url));
  }

  const engagementId = req.nextUrl.searchParams.get("engagementId");
  if (!engagementId) {
    return NextResponse.redirect(new URL("/clientes", req.url));
  }

  const engagement = await prisma.clientEngagement.findUnique({
    where: { id: engagementId },
    select: { slug: true, clientId: true },
  });
  if (!engagement) {
    return NextResponse.redirect(new URL("/clientes", req.url));
  }

  // Cookie vai anexado na PRÓPRIA resposta de redirect — cookies().set()
  // solto não sobrevive a um NextResponse.redirect construído à parte.
  const res = NextResponse.redirect(new URL(`/portal/${engagement.slug}`, req.url));
  res.cookies.set(PREVIEW_COOKIE, engagement.clientId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2,
  });
  return res;
}

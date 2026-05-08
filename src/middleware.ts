import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CRM_PREFIXES = [
  "/dashboard",
  "/leads",
  "/financeiro",
  "/pipeline",
  "/conversations",
  "/relatorios",
  "/tarefas",
  "/configuracoes",
  "/automations",
];

function isClientHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("clientes.") || host.startsWith("portal.");
}

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth");
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;
    const host = req.headers.get("host");
    const onClientHost = isClientHost(host);

    // ── Subdomínio do cliente (clientes.arthea.com.br) ──
    if (onClientHost) {
      // /, /dashboard, etc → empurra pro portal (ou login)
      if (CRM_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL(role === "CLIENT" ? "/portal" : "/login", req.url));
      }
      // raiz
      if (pathname === "/") {
        return NextResponse.redirect(new URL(role === "CLIENT" ? "/portal" : "/login", req.url));
      }
      // qualquer rota de portal exige CLIENT
      if (pathname.startsWith("/portal") && role !== "CLIENT") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    // ── Domínio principal (CRM) ──
    if (pathname.startsWith("/portal")) {
      if (role !== "CLIENT") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    if (CRM_PREFIXES.some((p) => pathname.startsWith(p))) {
      if (role === "CLIENT") {
        return NextResponse.redirect(new URL("/portal", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Permite a tela de login passar pelo middleware sem token (público)
        if (isPublicPath(pathname)) return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/portal/:path*",
    "/leads/:path*",
    "/financeiro/:path*",
    "/pipeline/:path*",
    "/conversations/:path*",
    "/relatorios/:path*",
    "/tarefas/:path*",
    "/configuracoes/:path*",
    "/automations/:path*",
  ],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Caminhos do painel da agência (qualquer coisa que NÃO seja /portal do cliente).
const ADMIN_PREFIXES = [
  "/inicio",
  "/crm",
  "/clientes",
  "/sistema",
  "/financeiro",
  "/admin",
  "/services",
  "/settings",
  // Aliases legados — redirects no next.config cuidam de levar pra rota nova
  "/dashboard",
  "/leads",
  "/pipeline",
  "/conversations",
  "/relatorios",
  "/tarefas",
  "/configuracoes",
  "/automations",
  "/portal-clientes",
  "/meta",
];

function isClientHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("clientes.") || host.startsWith("portal.");
}

function isMindfulnessHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("mindfulness.");
}

function isBrescancinHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("consulta.");
}

function isAnalisesHost(host: string | null) {
  if (!host) return false;
  return host.startsWith("analises.");
}

function isPropostaHost(host: string | null) {
  if (!host) return false;
  // "Google Meu Negócio" → propostagmn; aceita também propostagmb (sigla EN).
  return host.startsWith("propostagmn.") || host.startsWith("propostagmb.");
}

function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/api/auth");
}

function isPortalPath(pathname: string) {
  // /portal exato ou /portal/<algo> — NÃO inclui /portal-clientes (legado)
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

export default withAuth(
  function middleware(req) {
    const host = req.headers.get("host");

    // ── Subdomínio mindfulness — projeto Iasmim, totalmente isolado.
    // Não passa pela lógica de auth/redirect do CRM/portal.
    if (isMindfulnessHost(host)) {
      return NextResponse.next();
    }

    // ── Subdomínio clínica Brescancin — formulário pré-consulta,
    // totalmente isolado do CRM/portal e com auth próprio no /admin.
    if (isBrescancinHost(host)) {
      return NextResponse.next();
    }

    // ── Subdomínio análises GMB — páginas públicas para leads.
    if (isAnalisesHost(host)) {
      return NextResponse.next();
    }

    // ── Subdomínio proposta GMN — página comercial estática, pública.
    if (isPropostaHost(host)) {
      return NextResponse.next();
    }

    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;
    const onClientHost = isClientHost(host);

    // ── Subdomínio do cliente (clientes.arthea.com.br) ──
    if (onClientHost) {
      if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL(role === "CLIENT" ? "/portal" : "/login", req.url));
      }
      if (pathname === "/") {
        return NextResponse.redirect(new URL(role === "CLIENT" ? "/portal" : "/login", req.url));
      }
      if (isPortalPath(pathname) && role !== "CLIENT") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.next();
    }

    // ── Domínio principal (agência) ──
    if (isPortalPath(pathname)) {
      if (role !== "CLIENT") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
    if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
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
        const host = req.headers.get("host");
        // Subdomínio mindfulness não exige sessão NextAuth.
        if (isMindfulnessHost(host)) return true;
        // Subdomínio brescancin tem auth próprio (cookie HMAC) no /admin.
        if (isBrescancinHost(host)) return true;
        // Subdomínio análises é público (leads sem login).
        if (isAnalisesHost(host)) return true;
        // Subdomínio proposta GMN é público (página comercial por link).
        if (isPropostaHost(host)) return true;
        if (isPublicPath(pathname)) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    "/",
    "/portal/:path*",
    "/inicio/:path*",
    "/crm/:path*",
    "/clientes/:path*",
    "/sistema/:path*",
    "/financeiro/:path*",
    "/admin/:path*",
    "/services/:path*",
    "/settings/:path*",
    // Legados (passam pelo middleware antes do redirect do next.config aplicar)
    "/dashboard/:path*",
    "/leads/:path*",
    "/pipeline/:path*",
    "/conversations/:path*",
    "/relatorios/:path*",
    "/tarefas/:path*",
    "/configuracoes/:path*",
    "/automations/:path*",
    "/portal-clientes/:path*",
    "/meta/:path*",
  ],
};

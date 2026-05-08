import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;

    if (pathname.startsWith("/portal")) {
      if (role !== "CLIENT") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/leads") ||
      pathname.startsWith("/financeiro") ||
      pathname.startsWith("/pipeline") ||
      pathname.startsWith("/conversations") ||
      pathname.startsWith("/relatorios") ||
      pathname.startsWith("/tarefas") ||
      pathname.startsWith("/configuracoes") ||
      pathname.startsWith("/automations")
    ) {
      if (role === "CLIENT") {
        return NextResponse.redirect(new URL("/portal", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
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

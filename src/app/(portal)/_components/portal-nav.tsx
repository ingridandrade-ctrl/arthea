"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const items = [
  { href: "/portal", label: "Visão geral" },
  { href: "/portal/entregaveis", label: "Entregáveis" },
  { href: "/portal/acessos", label: "Acessos" },
  { href: "/portal/referencias", label: "Referências" },
];

export function PortalNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <nav
      style={{
        background: "#0D4A4A",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <span
          style={{
            color: "#9bf0e0",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "0.05em",
          }}
        >
          Arthea
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {items.map((item) => {
            const active =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: active ? "#FAF9F6" : "rgba(248,245,240,0.6)",
                  background: active ? "rgba(155,240,224,0.15)" : "transparent",
                  textDecoration: "none",
                  fontSize: 13,
                  padding: "6px 14px",
                  borderRadius: 6,
                  transition: "all 0.2s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "rgba(248,245,240,0.5)", fontSize: 12 }}>{userName}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            color: "rgba(248,245,240,0.5)",
            background: "transparent",
            border: "1px solid rgba(248,245,240,0.2)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}

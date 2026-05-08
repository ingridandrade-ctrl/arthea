"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ListChecks,
  KeyRound,
  BookmarkCheck,
  UserCircle,
  LogOut,
} from "lucide-react";

const items = [
  { href: "/portal", label: "Visão geral", icon: LayoutDashboard },
  { href: "/portal/entregaveis", label: "Entregáveis", icon: ListChecks },
  { href: "/portal/acessos", label: "Acessos", icon: KeyRound },
  { href: "/portal/referencias", label: "Referências", icon: BookmarkCheck },
  { href: "/portal/perfil", label: "Meu perfil", icon: UserCircle },
];

export function PortalSidebar({
  accent,
  logoUrl,
  userName,
  projectName,
}: {
  accent: string;
  logoUrl: string | null;
  userName: string;
  projectName: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 260,
        background: "white",
        borderRight: "0.5px solid rgba(13,74,74,0.08)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 18px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px", marginBottom: 32 }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: accent,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            A
          </div>
        )}
        <div style={{ overflow: "hidden" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#A0A0A0",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Arthea
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#2A2A2A",
              margin: "2px 0 0",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={projectName || "Portal"}
          >
            {projectName || "Portal"}
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => {
          const active =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 14,
                color: active ? "#0D4A4A" : "#4A4A4A",
                background: active ? "var(--accent-soft)" : "transparent",
                textDecoration: "none",
                fontWeight: active ? 500 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} strokeWidth={1.6} color={active ? "var(--accent)" : "#6B7280"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          borderTop: "0.5px solid rgba(13,74,74,0.08)",
          paddingTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: accent,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {(userName || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#2A2A2A",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {userName}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: "transparent",
            border: "none",
            color: "#6B7280",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
          }}
        >
          <LogOut size={16} strokeWidth={1.6} />
          Sair
        </button>
      </div>
    </aside>
  );
}

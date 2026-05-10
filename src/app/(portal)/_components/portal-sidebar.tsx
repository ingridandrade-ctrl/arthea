"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  KeyRound,
  BookmarkCheck,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ArtheaStar } from "./arthea-star";

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
  const [open, setOpen] = useState(false);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const sidebarBody = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 8px",
          marginBottom: 32,
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArtheaStar size={36} variant="gradient" />
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
            item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
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
              <Icon
                size={18}
                strokeWidth={1.6}
                color={active ? "var(--accent)" : "#6B7280"}
              />
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
    </>
  );

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="portal-hamburger"
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 50,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "white",
          border: "0.5px solid rgba(13,74,74,0.12)",
          boxShadow: "0 1px 2px rgba(13,74,74,0.06)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Menu size={18} strokeWidth={1.7} color="#2A2A2A" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className="portal-sidebar-desktop"
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
          zIndex: 40,
        }}
      >
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(13,74,74,0.4)",
              zIndex: 60,
              animation: "portal-fade-in 0.2s ease",
            }}
          />
          <aside
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              width: 280,
              background: "white",
              borderRight: "0.5px solid rgba(13,74,74,0.08)",
              display: "flex",
              flexDirection: "column",
              padding: "28px 18px 18px",
              zIndex: 70,
              animation: "portal-slide-in 0.24s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} strokeWidth={1.7} color="#6B7280" />
            </button>
            {sidebarBody}
          </aside>
        </>
      )}
    </>
  );
}

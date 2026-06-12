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
  Film,
  UserCircle,
  LogOut,
  Menu,
  X,
  FileText,
  Briefcase,
  Megaphone,
  Globe,
  MapPin,
  BarChart3,
} from "lucide-react";
import { ArtheaStar } from "./arthea-star";

type EngagementType = "STRATEGY" | "PAID_TRAFFIC" | "LANDING_PAGE" | "GMB";

const TYPE_ICON: Record<EngagementType, any> = {
  STRATEGY: Briefcase,
  PAID_TRAFFIC: Megaphone,
  LANDING_PAGE: Globe,
  GMB: MapPin,
};

const TYPE_LABEL: Record<EngagementType, string> = {
  STRATEGY: "Estratégia",
  PAID_TRAFFIC: "Tráfego",
  LANDING_PAGE: "Landing page",
  GMB: "Google Meu Negócio",
};

interface EngagementSummary {
  slug: string;
  name: string;
  type: EngagementType;
  accentColor: string;
}

export function PortalSidebar({
  accent,
  logoUrl,
  userName,
  engagements,
  scenesEnabled,
}: {
  accent: string;
  logoUrl: string | null;
  userName: string;
  engagements: EngagementSummary[];
  scenesEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isExactPath = (href: string) => pathname === href;
  const isUnderPath = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const sidebarBody = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 8px",
          marginBottom: 28,
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
          >
            Portal
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
        <SidebarItem
          href="/portal"
          label="Visão geral"
          icon={LayoutDashboard}
          active={isExactPath("/portal")}
        />
        <SidebarItem
          href="/portal/sobre"
          label="Sobre você"
          icon={FileText}
          active={isUnderPath("/portal/sobre")}
        />

        {engagements.map((e) => {
          const Icon = TYPE_ICON[e.type] || Briefcase;
          const base = `/portal/${e.slug}`;
          const sectionActive = isUnderPath(base);
          return (
            <div key={e.slug} style={{ marginTop: 16 }}>
              <SidebarSection
                label={TYPE_LABEL[e.type] || e.type}
                accent={e.accentColor}
              />
              <SidebarItem
                href={base}
                label={e.name}
                icon={Icon}
                active={isExactPath(base)}
                accent={e.accentColor}
                emphasized={sectionActive}
              />
              {e.type === "PAID_TRAFFIC" && (
                <SidebarItem
                  href={`${base}/dashboard`}
                  label="Dashboard"
                  icon={BarChart3}
                  active={isUnderPath(`${base}/dashboard`)}
                  indent
                />
              )}
              <SidebarItem
                href={`${base}/entregaveis`}
                label="Entregáveis"
                icon={ListChecks}
                active={isUnderPath(`${base}/entregaveis`)}
                indent
              />
              <SidebarItem
                href={`${base}/acessos`}
                label="Acessos"
                icon={KeyRound}
                active={isUnderPath(`${base}/acessos`)}
                indent
              />
              <SidebarItem
                href={`${base}/referencias`}
                label="Referências"
                icon={BookmarkCheck}
                active={isUnderPath(`${base}/referencias`)}
                indent
              />
              {scenesEnabled && (
                <SidebarItem
                  href={`${base}/acervo`}
                  label="Acervo de cenas"
                  icon={Film}
                  active={isUnderPath(`${base}/acervo`)}
                  indent
                />
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 24 }}>
          <SidebarItem
            href="/portal/perfil"
            label="Meu perfil"
            icon={UserCircle}
            active={isUnderPath("/portal/perfil")}
          />
        </div>
      </nav>

      <div
        style={{
          borderTop: "0.5px solid rgba(13,74,74,0.08)",
          paddingTop: 14,
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
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
          padding: "28px 14px 18px",
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
              padding: "28px 14px 18px",
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

function SidebarSection({ label, accent }: { label: string; accent: string }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#A0A0A0",
        margin: "8px 12px 6px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: accent,
          flexShrink: 0,
        }}
      />
      {label}
    </p>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  accent,
  indent,
  emphasized,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
  accent?: string;
  indent?: boolean;
  emphasized?: boolean;
}) {
  const activeColor = accent || "var(--accent)";
  const activeBg = accent ? accent + "12" : "var(--accent-soft)";
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: indent ? "8px 12px 8px 30px" : "10px 12px",
        borderRadius: 10,
        fontSize: indent ? 13 : 14,
        color: active ? "#0D4A4A" : "#4A4A4A",
        background: active ? activeBg : emphasized ? "rgba(13,74,74,0.025)" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 500 : 400,
        transition: "all 0.15s ease",
      }}
    >
      <Icon
        size={indent ? 15 : 17}
        strokeWidth={1.6}
        color={active ? activeColor : "#8B867B"}
      />
      <span
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

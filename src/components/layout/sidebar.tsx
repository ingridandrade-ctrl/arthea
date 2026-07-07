"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/hooks/use-sidebar";
import {
  Home,
  Users,
  KanbanSquare,
  MessageCircle,
  CheckSquare,
  BarChart3,
  Zap,
  FileText,
  PanelsTopLeft,
  DollarSign,
  Settings,
  Briefcase,
  UserCog,
  LogOut,
  Link2,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  match?: string;
};

type NavSection = {
  key: string;
  label: string;
  prefix: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    key: "crm",
    label: "CRM",
    prefix: "/crm",
    items: [
      { name: "Visão geral", href: "/crm", icon: Home, match: "/crm" },
      { name: "Leads", href: "/crm/leads", icon: Users },
      { name: "Pipeline", href: "/crm/pipeline", icon: KanbanSquare },
      { name: "Conversas", href: "/crm/conversations", icon: MessageCircle },
      { name: "Tarefas", href: "/crm/tarefas", icon: CheckSquare },
      { name: "Relatórios", href: "/crm/relatorios", icon: BarChart3 },
      { name: "Templates", href: "/crm/templates", icon: FileText },
      { name: "Fluxos", href: "/crm/fluxos", icon: Zap },
    ],
  },
  {
    key: "clientes",
    label: "Clientes",
    prefix: "/clientes",
    items: [
      { name: "Portal", href: "/clientes/portal", icon: PanelsTopLeft, roles: ["ADMIN", "MANAGER"] },
      { name: "Projetos", href: "/projetos", icon: KanbanSquare, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    key: "financeiro",
    label: "Financeiro",
    prefix: "/financeiro",
    items: [
      { name: "Visão geral", href: "/financeiro", icon: DollarSign, match: "/financeiro" },
    ],
  },
  {
    key: "sistema",
    label: "Configurações",
    prefix: "/sistema",
    items: [
      { name: "Integrações", href: "/sistema/integracoes", icon: Link2, roles: ["ADMIN", "MANAGER"] },
      { name: "Serviços", href: "/sistema/servicos", icon: Briefcase, roles: ["ADMIN", "MANAGER"] },
      { name: "Usuários", href: "/sistema/usuarios", icon: UserCog, roles: ["ADMIN"] },
      { name: "Sobre o Sistema", href: "/sistema", icon: Settings, match: "/sistema", roles: ["ADMIN"] },
    ],
  },
];

function currentSection(pathname: string): NavSection | null {
  if (pathname === "/projetos" || pathname.startsWith("/projetos/")) {
    return SECTIONS.find((s) => s.key === "clientes") || null;
  }
  return SECTIONS.find((s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/")) || null;
}

function isActive(pathname: string, item: NavItem) {
  const target = item.match ?? item.href;
  if (target === pathname) return true;
  if (target !== "/" && pathname.startsWith(target + "/")) return true;
  return false;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggle } = useSidebar();
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || "Usuário";
  const onInicio = pathname === "/inicio";

  const section = currentSection(pathname);

  const filterByRole = (items: NavItem[]) =>
    items.filter((i) => !i.roles || (userRole && i.roles.includes(userRole)));

  const sectionItems = section ? filterByRole(section.items) : [];

  return (
    <aside
      className={cn(
        "bg-sidebar/95 backdrop-blur-sm border-r border-border/60 shadow-[1px_0_3px_0_rgba(0,0,0,0.03)] h-screen flex flex-col fixed left-0 top-0 transition-[width] duration-300 ease-in-out z-40",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Brand + Collapse toggle */}
      <div className="px-3 pt-4 pb-2">
        <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between")}>
          <Link
            href="/inicio"
            className={cn(
              "flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-all duration-150",
              collapsed ? "justify-center px-0 py-1.5" : "px-2 py-1.5",
            )}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(145deg, #1D7070, #145C5C)" }}
            >
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 leading-tight">
                  Portal
                </p>
                <p className="text-sm font-medium leading-tight mt-0.5 truncate">
                  Agência Arthea
                </p>
              </div>
            )}
          </Link>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-150 active:scale-95"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <ChevronsLeft className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Início */}
      <div className="px-3 mt-1">
        <Link
          href="/inicio"
          className={cn(
            "group relative flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-150",
            collapsed ? "justify-center px-0 py-[7px]" : "px-3 py-[7px]",
            onInicio
              ? "bg-primary/[0.08] text-primary"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-[0.98]",
          )}
          title={collapsed ? "Início" : undefined}
        >
          {onInicio && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
          )}
          <Home className={cn("flex-shrink-0", collapsed ? "w-[18px] h-[18px]" : "w-[18px] h-[18px]")} strokeWidth={onInicio ? 1.8 : 1.5} />
          {!collapsed && "Início"}
        </Link>
      </div>

      {/* Section label */}
      {section && !collapsed && (
        <p className="px-6 mt-5 mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/60">
          {section.label}
        </p>
      )}

      {section && collapsed && <div className="mt-3" />}

      {/* Nav items */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg text-[13px] transition-all duration-150 mb-px",
                collapsed ? "justify-center px-0 py-[7px]" : "px-3 py-[7px]",
                active
                  ? "bg-primary/[0.08] text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-[0.98]",
              )}
              title={collapsed ? item.name : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
              )}
              <Icon
                className="w-[18px] h-[18px] flex-shrink-0"
                strokeWidth={active ? 1.8 : 1.5}
              />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Settings + User & logout */}
      <div className="p-3 border-t border-border/60">
        {/* Configurações link - always visible for ADMIN */}
        {userRole === "ADMIN" && !section?.key?.startsWith("sistema") && (
          <Link
            href="/sistema"
            className={cn(
              "group relative flex items-center gap-3 rounded-lg text-[13px] transition-all duration-150 mb-1",
              collapsed ? "justify-center px-0 py-[7px]" : "px-3 py-[7px]",
              pathname.startsWith("/sistema")
                ? "bg-primary/[0.08] text-primary font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-[0.98]",
            )}
            title={collapsed ? "Configurações" : undefined}
          >
            {pathname.startsWith("/sistema") && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-primary" />
            )}
            <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={pathname.startsWith("/sistema") ? 1.8 : 1.5} />
            {!collapsed && "Configurações"}
          </Link>
        )}

        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold ring-1 ring-border/60"
              title={userName}
            >
              {(userName || "?").charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500/80 transition-colors duration-150"
              title="Sair"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 px-2 mb-2 mt-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1 ring-border/60">
                {(userName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-medium truncate leading-tight">{userName}</p>
                <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5">
                  {userRole || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-red-500/80 hover:bg-red-500/[0.06] transition-all duration-150 w-full active:scale-[0.98]"
            >
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
              Sair
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
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
  Megaphone,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  Settings,
  Briefcase,
  UserCog,
  LogOut,
} from "lucide-react";

type Mode = "crm" | "clientes" | "financeiro";

type NavItem = {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  match?: string; // path prefix used to mark active (defaults to href)
};

const MODES: Array<{
  key: Mode;
  label: string;
  prefix: string;
  defaultHref: string;
  icon: any;
}> = [
  { key: "crm", label: "CRM", prefix: "/crm", defaultHref: "/crm", icon: TrendingUp },
  { key: "clientes", label: "Clientes", prefix: "/clientes", defaultHref: "/clientes/portal", icon: LayoutGrid },
  { key: "financeiro", label: "Financeiro", prefix: "/financeiro", defaultHref: "/financeiro", icon: DollarSign },
];

const CRM_ITEMS: NavItem[] = [
  { name: "Visão geral", href: "/crm", icon: Home, match: "/crm" },
  { name: "Leads", href: "/crm/leads", icon: Users },
  { name: "Pipeline", href: "/crm/pipeline", icon: KanbanSquare },
  { name: "Conversas", href: "/crm/conversations", icon: MessageCircle },
  { name: "Tarefas", href: "/crm/tarefas", icon: CheckSquare },
  { name: "Relatórios", href: "/crm/relatorios", icon: BarChart3 },
  { name: "Automações", href: "/crm/automacoes", icon: Zap },
  { name: "Templates", href: "/crm/templates", icon: FileText },
];

const CLIENTES_ITEMS: NavItem[] = [
  { name: "Portal dos clientes", href: "/clientes/portal", icon: PanelsTopLeft, roles: ["ADMIN", "MANAGER"] },
  { name: "Meta Ads", href: "/clientes/meta", icon: Megaphone, roles: ["ADMIN", "MANAGER"] },
  { name: "Google Ads", href: "/clientes/google-ads", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
];

const FINANCEIRO_ITEMS: NavItem[] = [
  { name: "Visão geral", href: "/financeiro", icon: Home, match: "/financeiro" },
];

const SISTEMA_ITEMS: NavItem[] = [
  { name: "Serviços", href: "/sistema/servicos", icon: Briefcase, roles: ["ADMIN", "MANAGER"] },
  { name: "Usuários", href: "/sistema/usuarios", icon: UserCog, roles: ["ADMIN"] },
  { name: "Configurações", href: "/sistema", icon: Settings, match: "/sistema", roles: ["ADMIN"] },
];

function modeForPath(pathname: string): Mode {
  for (const m of MODES) {
    if (pathname === m.prefix || pathname.startsWith(m.prefix + "/")) return m.key;
  }
  // Sistema fica sob o último modo que o usuário visitou — pro MVP default CRM
  return "crm";
}

function itemsForMode(mode: Mode): NavItem[] {
  if (mode === "crm") return CRM_ITEMS;
  if (mode === "clientes") return CLIENTES_ITEMS;
  return FINANCEIRO_ITEMS;
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
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name || "Usuário";
  const onInicio = pathname === "/inicio";
  const currentMode = modeForPath(pathname);

  const filterByRole = (items: NavItem[]) =>
    items.filter((i) => !i.roles || (userRole && i.roles.includes(userRole)));

  const modeItems = filterByRole(itemsForMode(currentMode));
  const systemItems = filterByRole(SISTEMA_ITEMS);

  return (
    <aside className="w-64 bg-sidebar border-r border-border h-screen flex flex-col fixed left-0 top-0">
      {/* Brand */}
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/inicio"
          className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors -mx-2"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-base"
            style={{ background: "linear-gradient(135deg, #1D7070, #0D4A4A)" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground leading-tight">
              Portal
            </p>
            <p className="text-sm font-medium leading-tight mt-0.5 truncate">
              Agência Arthea
            </p>
          </div>
        </Link>
      </div>

      {/* Início */}
      <div className="px-3">
        <Link
          href="/inicio"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            onInicio
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Home className="w-4 h-4" strokeWidth={1.7} />
          Início
        </Link>
      </div>

      {/* Mode switcher */}
      <div className="px-3 mt-3">
        <div
          className="grid grid-cols-3 gap-0.5 p-1 rounded-xl"
          style={{ background: "rgba(13,74,74,0.05)" }}
        >
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = currentMode === m.key && !onInicio;
            return (
              <Link
                key={m.key}
                href={m.defaultHref}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg text-[11px] font-medium transition-colors",
                  active
                    ? "bg-card text-primary shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.7} />
                <span className="leading-none">{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {!onInicio && (
        <p className="px-4 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80 flex items-center gap-2">
          <span className="w-3.5 h-px bg-primary/80" />
          {MODES.find((m) => m.key === currentMode)?.label}
        </p>
      )}

      {/* Nav itens do modo */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {!onInicio &&
          modeItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className="w-4 h-4"
                  strokeWidth={1.6}
                />
                {item.name}
              </Link>
            );
          })}

        {/* Sistema (sempre embaixo) */}
        {systemItems.length > 0 && (
          <div className={cn("mt-6 pt-4 border-t border-border")}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Sistema
            </p>
            {systemItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.6} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User & logout */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {(userName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium truncate leading-tight">{userName}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {userRole || "—"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.7} />
          Sair
        </button>
      </div>
    </aside>
  );
}

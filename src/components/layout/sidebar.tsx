"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  MessageCircle,
  Zap,
  Settings,
  LogOut,
  Briefcase,
  CheckSquare,
  BarChart3,
  FileText,
  DollarSign,
  ChevronDown,
  UserCog,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
  children?: { name: string; href: string; icon: any }[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { name: "Conversas", href: "/conversations", icon: MessageCircle },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Relatorios", href: "/relatorios", icon: BarChart3 },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, roles: ["ADMIN"] },
  {
    name: "Configuracoes",
    href: "/configuracoes",
    icon: Settings,
    children: [
      { name: "Geral", href: "/configuracoes", icon: Settings },
      { name: "Automacoes", href: "/configuracoes/automacoes", icon: Zap },
      { name: "Templates", href: "/configuracoes/templates", icon: FileText },
      { name: "Servicos", href: "/configuracoes/servicos", icon: Briefcase },
      { name: "Usuarios", href: "/configuracoes/usuarios", icon: UserCog },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const [configOpen, setConfigOpen] = useState(pathname.startsWith("/configuracoes"));

  return (
    <aside className="w-64 bg-sidebar border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Arthea</h1>
        <p className="text-xs text-muted-foreground">CRM & Automacoes</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          if (item.roles && !item.roles.includes(userRole)) return null;

          if (item.children) {
            const isChildActive = item.children.some((c) => pathname === c.href || (c.href !== "/configuracoes" && pathname.startsWith(c.href)));
            return (
              <div key={item.name}>
                <button
                  onClick={() => setConfigOpen(!configOpen)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isChildActive || configOpen
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", configOpen && "rotate-180")} />
                </button>
                {configOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href || (child.href !== "/configuracoes" && pathname.startsWith(child.href));
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}

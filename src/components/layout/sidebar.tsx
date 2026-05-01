"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { name: "Conversas", href: "/conversations", icon: MessageCircle },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { name: "Automacoes", href: "/automations", icon: Zap },
  { name: "Templates", href: "/admin/templates", icon: FileText },
  { name: "Relatorios", href: "/relatorios", icon: BarChart3 },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, roles: ["ADMIN"] as string[] },
  { name: "Servicos", href: "/services", icon: Briefcase },
  { name: "Configuracoes", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const filteredNavigation = navigation.filter((item) => {
    if (!("roles" in item) || !item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="w-64 bg-sidebar border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Arthea</h1>
        <p className="text-xs text-muted-foreground">CRM & Automacoes</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredNavigation.map((item) => {
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

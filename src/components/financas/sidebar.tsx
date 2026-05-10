"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  Settings,
  LogOut,
  PiggyBank,
  Repeat,
  CreditCard,
  BarChart3,
  Users,
  Target,
  User,
} from "lucide-react";

const NAV = [
  { name: "Dashboard", href: "/financas", icon: LayoutDashboard, exact: true },
  { name: "Lançamentos", href: "/financas/lancamentos", icon: ArrowLeftRight },
  { name: "Contas", href: "/financas/contas", icon: Wallet },
  { name: "Cartões", href: "/financas/cartoes", icon: CreditCard },
  { name: "Categorias", href: "/financas/categorias", icon: Tags },
  { name: "Orçamento", href: "/financas/orcamento", icon: BarChart3 },
  { name: "Recorrências", href: "/financas/recorrencias", icon: Repeat },
  { name: "Casal", href: "/financas/casal", icon: Users },
  { name: "Por pessoa", href: "/financas/por-pessoa", icon: User },
  { name: "Metas", href: "/financas/metas", icon: Target },
  { name: "Relatórios", href: "/financas/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/financas/configuracoes", icon: Settings },
];

export function FinancasSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/financas/auth/logout", { method: "POST" });
    router.push("/financas/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Finanças</h1>
            <p className="text-xs text-muted-foreground">Pessoais & do casal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
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
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}

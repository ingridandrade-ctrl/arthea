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

type NavItem = { name: string; href: string; icon: any; exact?: boolean };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão",
    items: [{ name: "Dashboard", href: "/financas/dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Dia-a-dia",
    items: [
      { name: "Movimentações", href: "/financas/lancamentos", icon: ArrowLeftRight },
      { name: "Cartões", href: "/financas/cartoes", icon: CreditCard },
      { name: "Recorrências", href: "/financas/recorrencias", icon: Repeat },
    ],
  },
  {
    label: "Análise",
    items: [
      { name: "Por pessoa", href: "/financas/por-pessoa", icon: User },
      { name: "Casal", href: "/financas/casal", icon: Users },
      { name: "Relatórios", href: "/financas/relatorios", icon: BarChart3 },
      { name: "Orçamento", href: "/financas/orcamento", icon: BarChart3 },
    ],
  },
  {
    label: "Cadastro",
    items: [
      { name: "Contas", href: "/financas/contas", icon: Wallet },
      { name: "Categorias", href: "/financas/categorias", icon: Tags },
      { name: "Metas", href: "/financas/metas", icon: Target },
    ],
  },
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
            <h1 className="text-lg font-bold leading-tight">Arthea</h1>
            <p className="text-xs text-muted-foreground leading-tight">Finanças Pessoais</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto pb-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/financas/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/financas/configuracoes"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          Configurações
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}

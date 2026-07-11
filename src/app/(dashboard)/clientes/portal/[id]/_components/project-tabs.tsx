"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, BarChart3, Sparkles, Settings2 } from "lucide-react";

// Abas fixas do projeto — o projeto é uma casa só; tudo dele mora aqui dentro.
export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/clientes/portal/${projectId}`;

  const tabs = [
    { label: "Conteúdo", href: base, icon: FolderKanban, exact: true },
    { label: "Performance", href: `${base}/performance`, icon: BarChart3 },
    { label: "Análise", href: `${base}/analise`, icon: Sparkles },
    { label: "Configuração", href: `${base}/config-dashboard`, icon: Settings2 },
  ];

  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname === t.href || pathname.startsWith(t.href + "/");
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
              active
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.8} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { useSidebar } from "@/lib/hooks/use-sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className="flex-1 transition-[margin-left] duration-300 ease-in-out"
      style={{ marginLeft: collapsed ? 72 : 256 }}
    >
      {children}
    </div>
  );
}

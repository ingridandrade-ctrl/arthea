"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ServiceFilter } from "./service-filter";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  // Filter de serviço (Todos / Tráfego pago / GMN / CRM / LP) só faz sentido no CRM —
  // é o filtro do funil de vendas. Em outros mundos, o header fica enxuto.
  const showServiceFilter = pathname?.startsWith("/crm");

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      {showServiceFilter ? <ServiceFilter /> : <div />}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{session?.user?.name}</p>
          <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {session?.user?.name?.charAt(0) || "U"}
        </div>
      </div>
    </header>
  );
}

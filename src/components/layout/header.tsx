"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ServiceFilter } from "./service-filter";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hideServiceFilter = pathname?.startsWith("/financeiro");

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      {hideServiceFilter ? <div /> : <ServiceFilter />}
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

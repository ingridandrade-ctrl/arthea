"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BotoesTeste({ temTeste }: { temTeste: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  async function chamar(method: "POST" | "DELETE") {
    if (method === "DELETE" && !confirm("Apagar os clientes de teste?")) return;
    setOcupado(true);
    await fetch("/api/rastreamento/clientes/teste", { method });
    setOcupado(false);
    router.refresh();
  }

  return temTeste ? (
    <button
      onClick={() => chamar("DELETE")}
      disabled={ocupado}
      className="px-3 py-2 text-sm text-muted-foreground hover:text-red-600 disabled:opacity-50"
    >
      Apagar dados de teste
    </button>
  ) : (
    <button
      onClick={() => chamar("POST")}
      disabled={ocupado}
      className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:border-foreground/30 disabled:opacity-50"
    >
      {ocupado ? "Criando…" : "Criar 2 clientes de teste"}
    </button>
  );
}

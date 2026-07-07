import { redirect } from "next/navigation";

// A lista de projetos que vivia aqui duplicava /clientes (e /projetos).
// A porta de entrada agora é uma só: /clientes → cliente → projeto.
// A subárvore /clientes/portal/[id] (detalhe do projeto) continua ativa.
export default function PortalClientesPage() {
  redirect("/clientes");
}

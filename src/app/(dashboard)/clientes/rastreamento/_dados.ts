import { prisma } from "@/lib/prisma";
import { CRMS } from "@/lib/rastreamento/crm";

// Opções dos selects do formulário
export async function opcoesDoFormulario() {
  const clientes = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return {
    clientes: clientes.map((c) => ({ id: c.id, nome: c.name })),
    crms: CRMS.map((c) => ({ id: c.id, nome: c.nome })),
  };
}

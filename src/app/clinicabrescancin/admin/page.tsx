import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isBrescancinAdminAuthenticated } from "@/lib/clinicabrescancin/admin-auth";
import AdminView, { type ResponseRow } from "./AdminView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isBrescancinAdminAuthenticated()) {
    redirect("/clinicabrescancin/admin/login");
  }

  const records = await prisma.brescancinResponse.findMany({
    orderBy: { createdAt: "desc" },
  });

  const rows: ResponseRow[] = records.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    nomeCompleto: r.nomeCompleto,
    apelido: r.apelido,
    dataNascimento: r.dataNascimento.toISOString(),
    genero: r.genero,
    estadoCivil: r.estadoCivil,
    profissao: r.profissao,
    temFilhos: r.temFilhos,
    pretendeFilhos: r.pretendeFilhos,
    cidade: r.cidade,
    telefone: r.telefone,
    email: r.email,
    instagram: r.instagram,
    answers: (r.answers ?? {}) as Record<string, unknown>,
  }));

  return <AdminView rows={rows} />;
}

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isBrescancinAdminAuthenticated } from "@/lib/clinicabrescancin/admin-auth";
import PatientView from "./PatientView";
import type { ResponseRow } from "../_sections";

export const dynamic = "force-dynamic";

export default async function PatientPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isBrescancinAdminAuthenticated()) {
    redirect("/clinicabrescancin/admin/login");
  }

  const r = await prisma.brescancinResponse.findUnique({
    where: { id: params.id },
  });
  if (!r) notFound();

  const row: ResponseRow = {
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
  };

  return <PatientView row={row} />;
}

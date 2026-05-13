import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Body = {
  nome?: string;
  email?: string;
  telefone?: string;
  profissao?: string;
  idade?: number | string;
  escolaridade?: string;
  estadoCivil?: string;
  meditacaoPrevia?: boolean;
  qualMeditacao?: string;
  tempoMeditacao?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const nome = body.nome?.trim();
  const email = body.email?.trim().toLowerCase();
  const idadeNum = typeof body.idade === "string" ? parseInt(body.idade, 10) : body.idade;

  if (!nome || nome.length < 2) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (!idadeNum || !Number.isInteger(idadeNum) || idadeNum < 12 || idadeNum > 120) {
    return NextResponse.json({ error: "Idade inválida." }, { status: 400 });
  }

  const data = {
    nome,
    email,
    idade: idadeNum,
    telefone: body.telefone?.trim() || null,
    profissao: body.profissao?.trim() || null,
    escolaridade: body.escolaridade?.trim() || null,
    estadoCivil: body.estadoCivil?.trim() || null,
    meditacaoPrevia: body.meditacaoPrevia === true,
    qualMeditacao: body.qualMeditacao?.trim() || null,
    tempoMeditacao: body.tempoMeditacao?.trim() || null,
  };

  const participant = await prisma.mindfulnessParticipant.upsert({
    where: { email },
    create: data,
    update: data,
    select: { id: true, email: true, nome: true },
  });

  return NextResponse.json(participant, { status: 201 });
}

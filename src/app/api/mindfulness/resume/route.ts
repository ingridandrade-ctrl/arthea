import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  const participant = await prisma.mindfulnessParticipant.findUnique({
    where: { email },
    include: {
      responses: { select: { instrument: true, answers: true } },
      drafts: { select: { instrument: true, answers: true } },
    },
  });
  if (!participant) {
    return NextResponse.json(
      { error: "Nenhum progresso encontrado para esse e-mail. Verifique se digitou corretamente." },
      { status: 404 },
    );
  }

  const ffmqResp = participant.responses.find((r) => r.instrument === "FFMQ");
  const dassResp = participant.responses.find((r) => r.instrument === "DASS21");
  const ffmqDraft = participant.drafts.find((d) => d.instrument === "FFMQ");
  const dassDraft = participant.drafts.find((d) => d.instrument === "DASS21");

  // Step derivado do estado do banco
  let step: "ffmq" | "transition" | "dass" | "done";
  if (ffmqResp && dassResp) step = "done";
  else if (dassDraft) step = "dass";
  else if (ffmqResp && !dassResp) step = "transition";
  else step = "ffmq";

  // Respostas: prefere a versão final (response) se existir
  const ffmqAnswers =
    (ffmqResp?.answers as Record<string, number> | undefined) ??
    (ffmqDraft?.answers as Record<string, number> | undefined) ??
    {};
  const dassAnswers =
    (dassResp?.answers as Record<string, number> | undefined) ??
    (dassDraft?.answers as Record<string, number> | undefined) ??
    {};

  return NextResponse.json({
    participantId: participant.id,
    nome: participant.nome,
    step,
    personal: {
      nome: participant.nome,
      email: participant.email,
      telefone: participant.telefone ?? "",
      profissao: participant.profissao ?? "",
      idade: String(participant.idade),
      escolaridade: participant.escolaridade ?? "",
      estadoCivil: participant.estadoCivil ?? "",
      meditacaoPrevia: participant.meditacaoPrevia ? "sim" : "nao",
      qualMeditacao: participant.qualMeditacao ?? "",
      tempoMeditacao: participant.tempoMeditacao ?? "",
    },
    ffmqAnswers,
    dassAnswers,
  });
}

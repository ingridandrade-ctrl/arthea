import { NextRequest, NextResponse } from "next/server";
import { MindfulnessInstrument } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  scoreFFMQ,
  scoreDASS,
  validateFFMQAnswers,
  validateDASSAnswers,
} from "@/lib/mindfulness/scoring";

type Body = {
  participantId?: string;
  instrument?: "FFMQ" | "DASS21";
  answers?: Record<string, number>;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { participantId, instrument, answers } = body;

  if (!participantId || typeof participantId !== "string") {
    return NextResponse.json({ error: "participantId ausente." }, { status: 400 });
  }
  if (instrument !== "FFMQ" && instrument !== "DASS21") {
    return NextResponse.json({ error: "instrument inválido." }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers ausente." }, { status: 400 });
  }

  // Normaliza chaves string → number
  const normalized: Record<number, number> = {};
  for (const [k, v] of Object.entries(answers)) {
    const idx = parseInt(k, 10);
    if (!Number.isInteger(idx) || typeof v !== "number") continue;
    normalized[idx] = v;
  }

  const participant = await prisma.mindfulnessParticipant.findUnique({
    where: { id: participantId },
    select: { id: true },
  });
  if (!participant) {
    return NextResponse.json({ error: "Participante não encontrada." }, { status: 404 });
  }

  let scores: Record<string, number>;
  if (instrument === "FFMQ") {
    const v = validateFFMQAnswers(normalized);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    scores = scoreFFMQ(normalized);
  } else {
    const v = validateDASSAnswers(normalized);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    scores = scoreDASS(normalized);
  }

  // Salva a resposta definitiva e remove o rascunho correspondente
  // (se houver) — não faz sentido manter ambos.
  await prisma.$transaction([
    prisma.mindfulnessResponse.upsert({
      where: {
        participantId_instrument: {
          participantId,
          instrument: instrument as MindfulnessInstrument,
        },
      },
      create: {
        participantId,
        instrument: instrument as MindfulnessInstrument,
        answers: normalized,
        scores,
      },
      update: {
        answers: normalized,
        scores,
      },
    }),
    prisma.mindfulnessDraft.deleteMany({
      where: {
        participantId,
        instrument: instrument as MindfulnessInstrument,
      },
    }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}

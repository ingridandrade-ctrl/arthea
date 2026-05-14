import { NextRequest, NextResponse } from "next/server";
import { MindfulnessInstrument } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

  // Normaliza e filtra: aceita respostas parciais, mas valida cada uma.
  const normalized: Record<number, number> = {};
  const min = instrument === "FFMQ" ? 1 : 0;
  const max = instrument === "FFMQ" ? 5 : 3;
  for (const [k, v] of Object.entries(answers)) {
    const idx = parseInt(k, 10);
    if (!Number.isInteger(idx) || idx < 1) continue;
    if (typeof v !== "number" || !Number.isInteger(v)) continue;
    if (v < min || v > max) continue;
    normalized[idx] = v;
  }

  const participant = await prisma.mindfulnessParticipant.findUnique({
    where: { id: participantId },
    select: { id: true },
  });
  if (!participant) {
    return NextResponse.json({ error: "Participante não encontrada." }, { status: 404 });
  }

  await prisma.mindfulnessDraft.upsert({
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
    },
    update: {
      answers: normalized,
    },
  });

  return NextResponse.json({ ok: true });
}

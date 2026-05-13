import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/mindfulness/admin-auth";
import {
  FFMQ_LABELS,
  DASS_LABELS,
  ffmqBand,
  ffmqMax,
  dassBand,
  type FFMQFacet,
  type FFMQScores,
  type DASSSubscale,
  type DASSScores,
} from "@/lib/mindfulness/scoring";
import {
  interpretFFMQ,
  interpretDASS,
  generateCollectiveInsights,
} from "@/lib/mindfulness/interpretation";
import PainelView, { type PainelData } from "./PainelView";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  if (!isAdminAuthenticated()) {
    redirect("/mindfulness/painel/login");
  }

  const participants = await prisma.mindfulnessParticipant.findMany({
    include: { responses: true },
    orderBy: { createdAt: "asc" },
  });

  const data: PainelData = {
    participants: participants.map((p) => {
      const ffmqResp = p.responses.find((r) => r.instrument === "FFMQ");
      const dassResp = p.responses.find((r) => r.instrument === "DASS21");
      const ffmqScores = ffmqResp ? (ffmqResp.scores as unknown as FFMQScores) : null;
      const dassScores = dassResp ? (dassResp.scores as unknown as DASSScores) : null;

      return {
        id: p.id,
        nome: p.nome,
        email: p.email,
        idade: p.idade,
        profissao: p.profissao,
        escolaridade: p.escolaridade,
        estadoCivil: p.estadoCivil,
        meditacaoPrevia: p.meditacaoPrevia,
        qualMeditacao: p.qualMeditacao,
        tempoMeditacao: p.tempoMeditacao,
        ffmq: ffmqScores
          ? {
              scores: ffmqScores,
              answers: ffmqResp!.answers as Record<string, number>,
              bands: (Object.keys(FFMQ_LABELS) as FFMQFacet[]).reduce((acc, f) => {
                acc[f] = ffmqBand(f, ffmqScores[f]);
                return acc;
              }, {} as Record<FFMQFacet, "abaixo" | "media" | "acima">),
              maxes: (Object.keys(FFMQ_LABELS) as FFMQFacet[]).reduce((acc, f) => {
                acc[f] = ffmqMax(f);
                return acc;
              }, {} as Record<FFMQFacet, number>),
              interpretation: interpretFFMQ(ffmqScores, p.nome),
              respondedAt: ffmqResp!.createdAt.toISOString(),
            }
          : null,
        dass: dassScores
          ? {
              scores: dassScores,
              answers: dassResp!.answers as Record<string, number>,
              bands: (Object.keys(DASS_LABELS) as DASSSubscale[]).reduce((acc, s) => {
                acc[s] = dassBand(s, dassScores[s]);
                return acc;
              }, {} as Record<DASSSubscale, string>),
              interpretation: interpretDASS(dassScores, p.nome),
              respondedAt: dassResp!.createdAt.toISOString(),
            }
          : null,
      };
    }),
    insights: generateCollectiveInsights({
      ffmqScores: participants
        .map((p) => p.responses.find((r) => r.instrument === "FFMQ")?.scores as unknown as FFMQScores | undefined)
        .filter((s): s is FFMQScores => !!s),
      dassScores: participants
        .map((p) => p.responses.find((r) => r.instrument === "DASS21")?.scores as unknown as DASSScores | undefined)
        .filter((s): s is DASSScores => !!s),
      meditacaoPrevia: participants
        .filter((p) => p.responses.some((r) => r.instrument === "FFMQ"))
        .map((p) => p.meditacaoPrevia),
    }),
  };

  return <PainelView data={data} />;
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: retorna quantos FlowSteps (em fluxos ativos ou não) usam esse template
// FlowStep.actionConfig é JSON, com { templateId } pra ações send_whatsapp.
// Também olhamos botões de outros templates que disparam esse via trigger_template.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const templateId = params.id;

  // FlowSteps usando esse template no actionConfig
  const steps = await prisma.flowStep.findMany({
    where: {
      actionType: "send_whatsapp",
      actionConfig: { path: ["templateId"], equals: templateId },
    },
    select: {
      id: true,
      flow: { select: { id: true, name: true, isActive: true } },
    },
  });

  const flowsMap = new Map<string, { id: string; name: string; isActive: boolean; stepCount: number }>();
  for (const s of steps) {
    if (!s.flow) continue;
    const existing = flowsMap.get(s.flow.id);
    if (existing) {
      existing.stepCount += 1;
    } else {
      flowsMap.set(s.flow.id, { id: s.flow.id, name: s.flow.name, isActive: s.flow.isActive, stepCount: 1 });
    }
  }

  const flows = Array.from(flowsMap.values());
  const activeFlows = flows.filter((f) => f.isActive).length;

  return NextResponse.json({
    templateId,
    flowCount: flows.length,
    activeFlowCount: activeFlows,
    stepCount: steps.length,
    flows,
  });
}

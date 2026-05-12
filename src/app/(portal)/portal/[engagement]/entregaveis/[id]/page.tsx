import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  PHASE_NAMES,
  STATUS_BG,
  STATUS_FG,
  STATUS_LABEL,
  type DeliverableStatus,
} from "../../../../_components/deliverable-status";
import { ValidationForm } from "../../../../_components/validation-form";
import { SimpleApprove } from "../../../../_components/simple-approve";
import { CommentsSection } from "../../../../_components/comments-section";
import { DocumentViewer } from "../../../../_components/document-viewer";

export default async function DeliverableDetail({
  params,
}: {
  params: { id: string; engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id: params.id },
    include: {
      engagement: { select: { clientId: true, name: true, slug: true } },
      questions: { orderBy: { order: "asc" } },
      responses: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!deliverable) notFound();
  if (deliverable.engagement.clientId !== userId) redirect("/portal");
  if (deliverable.engagement.slug !== params.engagement) notFound();

  const authorIds = Array.from(new Set(deliverable.comments.map((c) => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  const status = deliverable.status as DeliverableStatus;
  const responsesByQuestion = new Map(deliverable.responses.map((r) => [r.questionId, r.answer]));

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Link
        href={`/portal/${params.engagement}/entregaveis`}
        style={{
          fontSize: 12.5,
          color: "#6B7280",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar para entregáveis
      </Link>

      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              margin: 0,
            }}
          >
            Fase {deliverable.phase} · {PHASE_NAMES[deliverable.phase]}
          </p>
          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 32,
              fontWeight: 400,
              color: "#2A2A2A",
              margin: "8px 0 0",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            {deliverable.title}
          </h1>
          {deliverable.description && (
            <p style={{ fontSize: 14, color: "#4A4A4A", marginTop: 12 }}>
              {deliverable.description}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            background: STATUS_BG[status],
            color: STATUS_FG[status],
            padding: "6px 12px",
            borderRadius: 999,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      {/* Documento */}
      <DocumentViewer url={deliverable.documentUrl} embed={deliverable.documentEmbed} />

      {/* Validação */}
      {(status === "WAITING_REVIEW" || status === "REVISION" || status === "APPROVED") && (
        deliverable.questions.length > 0 ? (
          <ValidationForm
            deliverableId={deliverable.id}
            questions={deliverable.questions.map((q) => ({
              id: q.id,
              question: q.question,
              type: q.type,
              options: q.options,
              isRequired: q.isRequired,
              previousAnswer: responsesByQuestion.get(q.id) || "",
            }))}
            readOnly={status === "APPROVED"}
            initialStatus={status}
          />
        ) : (
          <SimpleApprove
            deliverableId={deliverable.id}
            currentStatus={status}
          />
        )
      )}

      {/* Comentários */}
      <CommentsSection
        deliverableId={deliverable.id}
        comments={deliverable.comments.map((c) => ({
          id: c.id,
          content: c.content,
          isFromArthea: c.isFromArthea,
          createdAt: c.createdAt.toISOString(),
          authorName: authorMap.get(c.authorId) || "Usuário",
        }))}
      />
    </div>
  );
}

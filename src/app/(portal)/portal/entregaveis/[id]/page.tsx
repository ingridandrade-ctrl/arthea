import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  STATUS_BG,
  STATUS_FG,
  STATUS_LABEL,
  type DeliverableStatus,
} from "../../../_components/deliverable-status";
import { ValidationForm } from "../../../_components/validation-form";
import { CommentsSection } from "../../../_components/comments-section";

export default async function DeliverableDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const deliverable = await prisma.clientDeliverable.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { clientId: true, name: true } },
      questions: { orderBy: { order: "asc" } },
      responses: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!deliverable) notFound();
  if (deliverable.project.clientId !== userId) redirect("/portal");

  // Resolve comment authors
  const authorIds = Array.from(new Set(deliverable.comments.map((c) => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  const status = deliverable.status as DeliverableStatus;
  const responsesByQuestion = new Map(deliverable.responses.map((r) => [r.questionId, r.answer]));

  return (
    <div>
      <Link
        href="/portal/entregaveis"
        style={{
          fontSize: 12,
          color: "#6B7280",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 16,
        }}
      >
        ← Voltar para entregáveis
      </Link>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#1D7070",
              marginBottom: 8,
            }}
          >
            Fase {deliverable.phase}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#2A2A2A",
              margin: 0,
              fontFamily: "Georgia, serif",
            }}
          >
            {deliverable.title}
          </h1>
          {deliverable.description && (
            <p style={{ fontSize: 14, color: "#4A4A4A", marginTop: 8 }}>{deliverable.description}</p>
          )}
        </div>
        <span
          style={{
            fontSize: 11,
            background: STATUS_BG[status],
            color: STATUS_FG[status],
            padding: "6px 12px",
            borderRadius: 6,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Documento */}
      <div
        style={{
          background: "white",
          border: "0.5px solid rgba(29,112,112,0.15)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#A0A0A0",
            marginBottom: 12,
          }}
        >
          Documento
        </p>
        {deliverable.documentEmbed ? (
          <div
            style={{ fontSize: 14, color: "#2A2A2A", lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: deliverable.documentEmbed }}
          />
        ) : deliverable.documentUrl ? (
          <a
            href={deliverable.documentUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              background: "#1D7070",
              color: "white",
              fontSize: 13,
              padding: "10px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Abrir documento ↗
          </a>
        ) : (
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Documento em preparação.</p>
        )}
      </div>

      {/* Validação */}
      {(status === "WAITING_REVIEW" || status === "REVISION" || status === "APPROVED") &&
        deliverable.questions.length > 0 && (
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

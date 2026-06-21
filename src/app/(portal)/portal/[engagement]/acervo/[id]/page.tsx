import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Film } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCENE_THEMES, visualStatus, SCENE_STATUS_BG, SCENE_STATUS_FG, SCENE_STATUS_LABEL } from "@/lib/scenes";
import { SceneActions } from "../_components/scene-actions";
import { SceneComments } from "../_components/scene-comments";

export default async function SceneDetailPage({
  params,
}: {
  params: { id: string; engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const scene = await prisma.scene.findUnique({
    where: { id: params.id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!scene) notFound();
  if (scene.clientId !== userId) redirect("/portal");

  const authorIds = Array.from(new Set(scene.comments.map((c) => c.authorId)));
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  const theme = SCENE_THEMES[scene.theme];
  const vs = visualStatus(scene);

  return (
    <div
      className="portal-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        // sobrescreve accent local pelo accent do tema
        ["--accent" as any]: theme.color,
        ["--accent-soft" as any]: theme.color + "12",
        ["--accent-border" as any]: theme.color + "33",
        ["--accent-deep" as any]: theme.color,
      }}
    >
      <Link
        href={`/portal/${params.engagement}/acervo`}
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
        <ArrowLeft size={14} strokeWidth={1.7} /> Voltar ao acervo
      </Link>

      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <p
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: theme.color,
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ width: 16, height: 1, background: theme.color }} />
            {theme.label} · cena {String(scene.order).padStart(2, "0")}
          </p>
          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: "clamp(28px, 4vw, 38px)",
              fontWeight: 400,
              color: "#1A1A1A",
              margin: "10px 0 0",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            {scene.characters}
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "8px 0 0" }}>
            <Film size={12} strokeWidth={1.8} style={{ display: "inline", marginRight: 6, verticalAlign: "-1px" }} />
            {scene.type} · {scene.work}
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            background: SCENE_STATUS_BG[vs],
            color: SCENE_STATUS_FG[vs],
            padding: "6px 14px",
            borderRadius: 999,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {SCENE_STATUS_LABEL[vs]}
        </span>
      </header>

      {/* Cards de info estrutural */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
        }}
      >
        <InfoCard label="Contexto" content={scene.context} />
        <InfoCard label="Cena + fala icônica" content={scene.sceneAndQuote} multiline />
        {scene.hook && <InfoCard label="Gancho" content={`"${scene.hook}"`} italic />}
        <InfoCard
          label="Ângulo clínico"
          content={scene.clinicalAngle}
          highlight
        />
        {scene.platform && (
          <InfoCard label="Plataforma" content={scene.platform} mono />
        )}
      </section>

      {/* Vídeo se houver */}
      {scene.videoLink && (
        <section
          style={{
            background: "white",
            border: "0.5px solid rgba(13,74,74,0.10)",
            borderRadius: 14,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
                fontSize: 10.5,
                color: "#8B867B",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Vídeo
            </p>
            <p style={{ fontSize: 13.5, color: "#4A4A4A", margin: "4px 0 0", wordBreak: "break-all" }}>
              {scene.videoLink}
            </p>
          </div>
          <a
            href={scene.videoLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: theme.color,
              color: "white",
              fontSize: 13,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Abrir
            <ExternalLink size={13} strokeWidth={1.8} />
          </a>
        </section>
      )}

      {/* Ações: status + roteiro */}
      <SceneActions
        sceneId={scene.id}
        initialStatus={scene.status}
        initialScript={scene.scriptText}
        initialVideoLink={scene.videoLink}
        themeColor={theme.color}
      />

      {/* Comentários */}
      <SceneComments
        sceneId={scene.id}
        themeColor={theme.color}
        comments={scene.comments.map((c) => ({
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

function InfoCard({
  label,
  content,
  multiline,
  highlight,
  italic,
  mono,
}: {
  label: string;
  content: string;
  multiline?: boolean;
  highlight?: boolean;
  italic?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        background: highlight ? "var(--accent-soft)" : "white",
        border: highlight
          ? "0.5px solid var(--accent-border)"
          : "0.5px solid rgba(13,74,74,0.10)",
        borderLeft: highlight ? `3px solid var(--accent)` : undefined,
        borderRadius: 14,
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          fontFamily: "ui-monospace, 'JetBrains Mono', Menlo, monospace",
          fontSize: 10.5,
          color: highlight ? "var(--accent)" : "#8B867B",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: 0,
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: highlight ? 15 : 14,
          color: highlight ? "var(--accent-deep)" : "#1A1A1A",
          margin: "10px 0 0",
          lineHeight: 1.6,
          fontStyle: italic ? "italic" : undefined,
          fontFamily: mono
            ? "ui-monospace, 'JetBrains Mono', Menlo, monospace"
            : undefined,
          whiteSpace: multiline ? "pre-line" : undefined,
          fontWeight: highlight ? 500 : 400,
        }}
      >
        {content}
      </p>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { Pin, FolderOpen, FileText, LayoutGrid, Link2 } from "lucide-react";

const TYPE_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  pinterest: { icon: Pin, label: "Pinterest", color: "#E60023", bg: "#FFE5E9" },
  drive: { icon: FolderOpen, label: "Google Drive", color: "#0F9D58", bg: "#E0F5E9" },
  pdf: { icon: FileText, label: "PDF", color: "#DC2626", bg: "#FEE2E2" },
  miro: { icon: LayoutGrid, label: "Miro", color: "#FFD02F", bg: "#FFF8DC" },
  link: { icon: Link2, label: "Link", color: "#1D7070", bg: "#E0F2EF" },
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function faviconUrl(url: string) {
  const domain = getDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export default async function ReferenciasPage({
  params,
}: {
  params: { engagement: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");

  const project = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    include: { references: { orderBy: { order: "asc" } } },
  });
  if (!project) notFound();

  return (
    <div className="portal-fade-in" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <header>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ display: "inline-block", width: 24, height: 1, background: "var(--accent)" }} />
          Referências
        </p>
        <h1
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "clamp(32px, 4.5vw, 44px)",
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "12px 0 10px",
            letterSpacing: "-0.025em",
            lineHeight: 1.1,
          }}
        >
          Materiais e{" "}
          <em
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--accent)",
            }}
          >
            inspirações
          </em>
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", margin: 0, maxWidth: 580 }}>
          Documentos, painéis e links úteis para o projeto.
        </p>
      </header>

      {project.references.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#A0A0A0",
            fontSize: 14,
            border: "1px dashed rgba(13,74,74,0.15)",
            borderRadius: 18,
          }}
        >
          Nenhuma referência cadastrada ainda.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {project.references.map((r, idx) => {
            const meta = TYPE_META[r.type] || TYPE_META.link;
            const Icon = meta.icon;
            const fav = faviconUrl(r.url);
            const domain = getDomain(r.url);
            return (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="portal-card-hover portal-stagger"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  background: "white",
                  border: "0.5px solid rgba(29,112,112,0.08)",
                  borderRadius: 18,
                  padding: 22,
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: "0 1px 2px rgba(13,74,74,0.03)",
                  position: "relative",
                  overflow: "hidden",
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: meta.bg,
                      color: meta.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} strokeWidth={1.7} />
                  </div>
                  {fav && (
                    <img
                      src={fav}
                      alt=""
                      width={20}
                      height={20}
                      style={{ borderRadius: 4, opacity: 0.7 }}
                    />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14.5,
                      fontWeight: 500,
                      color: "#2A2A2A",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {r.title}
                  </p>
                  {r.description && (
                    <p style={{ fontSize: 12.5, color: "#6B7280", margin: "6px 0 0" }}>
                      {r.description}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "#A0A0A0",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{domain}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: meta.color,
                    }}
                  >
                    {meta.label} →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

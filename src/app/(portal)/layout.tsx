import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { PortalSidebar } from "./_components/portal-sidebar";

export const metadata = {
  title: "Portal do cliente",
  description:
    "Seu projeto com a Arthea — entregáveis, acessos e tudo o que importa em um só lugar.",
  openGraph: {
    title: "Portal Arthea",
    description:
      "Seu projeto com a Arthea — entregáveis, acessos e tudo o que importa em um só lugar.",
    siteName: "Arthea",
    locale: "pt_BR",
    type: "website",
  },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // CLIENT entra direto; ADMIN/MANAGER só com preview ativo (cookie de
  // "ver como o cliente" setado por /api/portal-preview).
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");
  const isPreview = (session.user as any).role !== "CLIENT";

  const [engagements, currentUser] = await Promise.all([
    prisma.clientEngagement.findMany({
      where: { clientId: userId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        accentColor: true,
        logoUrl: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, scenesEnabled: true },
    }),
  ]);
  const scenesEnabled = !!currentUser?.scenesEnabled;

  const primary = engagements[0];
  const accent = primary?.accentColor || "#1D7070";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF9F6",
        backgroundImage:
          "linear-gradient(rgba(13,74,74,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(13,74,74,0.035) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        backgroundPosition: "-1px -1px",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        color: "#2A2A2A",
        ["--accent" as any]: accent,
        ["--accent-hover" as any]: accent + "EE",
        ["--accent-soft" as any]: accent + "12",
        ["--accent-border" as any]: accent + "33",
        ["--accent-mint" as any]: "#9bf0e0",
        ["--accent-deep" as any]: "#0D4A4A",
      }}
    >
      <PortalSidebar
        accent={accent}
        logoUrl={primary?.logoUrl || null}
        userName={session.user?.name || ""}
        scenesEnabled={scenesEnabled}
        engagements={engagements.map((e) => ({
          slug: e.slug,
          name: e.name,
          type: e.type,
          accentColor: e.accentColor,
        }))}
      />
      <main
        className="portal-main"
        style={{
          marginLeft: 260,
          padding: "48px 56px",
          maxWidth: 1080,
        }}
      >
        {isPreview && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              background: "#FEF3C7",
              border: "1px solid #F59E0B55",
              color: "#92400E",
              borderRadius: 12,
              padding: "10px 16px",
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            <span>
              <strong>Modo preview</strong> — você está vendo a área de membros como{" "}
              {currentUser?.name || "o cliente"} vê.
            </span>
            <a
              href="/api/portal-preview/exit?to=/clientes"
              style={{
                color: "#92400E",
                fontWeight: 600,
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              Sair do preview
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

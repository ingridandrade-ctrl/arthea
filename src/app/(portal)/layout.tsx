import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PortalSidebar } from "./_components/portal-sidebar";

export const metadata = {
  title: "Portal Arthea",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role !== "CLIENT") redirect("/dashboard");

  const userId = (session.user as any).id;
  const project = await prisma.clientProject.findUnique({
    where: { clientId: userId },
    select: {
      name: true,
      currentPhase: true,
      accentColor: true,
      logoUrl: true,
      _count: { select: { deliverables: true } },
    },
  });

  const accent = project?.accentColor || "#1D7070";

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
        logoUrl={project?.logoUrl || null}
        userName={session.user?.name || ""}
        projectName={project?.name || null}
      />
      <main
        className="portal-main"
        style={{
          marginLeft: 260,
          padding: "48px 56px",
          maxWidth: 1080,
        }}
      >
        {children}
      </main>
    </div>
  );
}

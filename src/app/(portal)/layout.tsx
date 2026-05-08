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
        fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
        color: "#2A2A2A",
        // CSS variables for accent so all sub-pages can reuse
        ["--accent" as any]: accent,
        ["--accent-hover" as any]: accent + "EE",
        ["--accent-soft" as any]: accent + "1A",
        ["--accent-border" as any]: accent + "33",
      }}
    >
      <PortalSidebar
        accent={accent}
        logoUrl={project?.logoUrl || null}
        userName={session.user?.name || ""}
        projectName={project?.name || null}
      />
      <main
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

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PortalNav } from "./_components/portal-nav";

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF9F6",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        color: "#2A2A2A",
      }}
    >
      <PortalNav userName={session.user?.name || ""} />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>{children}</main>
    </div>
  );
}

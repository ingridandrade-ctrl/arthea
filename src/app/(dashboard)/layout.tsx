import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/lib/hooks/use-sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <DashboardShell>
          <Header />
          {/* Canvas da marca — mesmo fundo do portal do cliente: off-white
              quente + grade milimetrada teal sutil */}
          <main
            className="p-6 min-w-0 overflow-x-auto"
            style={{
              backgroundImage:
                "linear-gradient(rgba(13,74,74,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(13,74,74,0.035) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              backgroundPosition: "-1px -1px",
            }}
          >
            {children}
          </main>
        </DashboardShell>
      </div>
    </SidebarProvider>
  );
}

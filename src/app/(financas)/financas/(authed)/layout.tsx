import { redirect } from "next/navigation";
import { getSessionFromCookies, householdExists } from "@/lib/financas/session";
import { FinancasSidebar } from "@/components/financas/sidebar";

export default async function FinancasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSessionFromCookies();

  if (!session) {
    const exists = await householdExists();
    redirect(exists ? "/financas/login" : "/financas/setup");
  }

  return (
    <div className="flex min-h-screen">
      <FinancasSidebar />
      <div className="flex-1 ml-64">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

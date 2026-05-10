import { redirect } from "next/navigation";
import {
  getSessionFromCookies,
  householdExists,
} from "@/lib/financas/session";
import { SetupForm } from "./setup-form";

export default async function FinancasSetupPage() {
  const session = getSessionFromCookies();
  if (session) redirect("/financas");
  const exists = await householdExists();
  if (exists) redirect("/financas/login");
  return <SetupForm />;
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getEffectivePortalClientId } from "@/lib/portal-viewer";
import { prisma } from "@/lib/prisma";
import { parseDossier } from "@/lib/dossier";
import { DossierForm } from "../_components/dossier-form";

export default async function DossierEditPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = getEffectivePortalClientId(session);
  if (!userId) redirect("/inicio");

  const row = await prisma.clientDossier.findUnique({ where: { clientId: userId } });
  const dossier = parseDossier({
    digitalPresence: row?.digitalPresence,
    brandContext: row?.brandContext,
    voice: row?.voice,
    market: row?.market,
    contacts: row?.contacts,
    commercial: row?.commercial,
    archive: row?.archive,
    brandIdentity: row?.brandIdentity,
    performance: row?.performance,
  });

  return <DossierForm initialData={dossier} />;
}

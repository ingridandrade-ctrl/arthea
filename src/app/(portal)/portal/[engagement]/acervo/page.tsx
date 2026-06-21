import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCENE_THEME_KEYS, SCENE_THEMES } from "@/lib/scenes";
import { ScenesView } from "./_components/scenes-view";

export default async function AcervoPage({ params }: { params: { engagement: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { scenesEnabled: true },
  });
  if (!user?.scenesEnabled) notFound();

  // Confirma que o engagement bate com o user
  const engagement = await prisma.clientEngagement.findUnique({
    where: { clientId_slug: { clientId: userId, slug: params.engagement } },
    select: { slug: true },
  });
  if (!engagement) notFound();

  const scenes = await prisma.scene.findMany({
    where: { clientId: userId },
    orderBy: [{ theme: "asc" }, { order: "asc" }],
    include: { _count: { select: { comments: true } } },
  });

  const themes = SCENE_THEME_KEYS.map((key) => ({
    key,
    ...SCENE_THEMES[key],
    scenes: scenes
      .filter((s) => s.theme === key)
      .map((s) => ({
        id: s.id,
        order: s.order,
        characters: s.characters,
        type: s.type,
        work: s.work,
        hook: s.hook,
        status: s.status,
        hasScript: !!(s.scriptText && s.scriptText.trim().length > 0),
        commentCount: s._count.comments,
      })),
  }));

  return <ScenesView themes={themes} engagementSlug={engagement.slug} />;
}

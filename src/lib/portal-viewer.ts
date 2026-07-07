import { cookies } from "next/headers";

// Preview "ver como o cliente": ADMIN/MANAGER podem navegar a área de
// membros de um cliente específico. O clientId em preview vive num cookie
// httpOnly setado por /api/portal-preview e limpo por /api/portal-preview/exit.

export const PREVIEW_COOKIE = "arthea_preview_client";

// clientId efetivo pro portal: o próprio (CLIENT) ou o do preview (admin).
// Retorna null quando não há como resolver — quem chama redireciona.
export function getEffectivePortalClientId(session: any): string | null {
  if (!session?.user) return null;
  const role = session.user.role;
  const id = session.user.id;
  if (role === "CLIENT") return id ?? null;
  if (role === "ADMIN" || role === "MANAGER") {
    return cookies().get(PREVIEW_COOKIE)?.value ?? null;
  }
  return null;
}

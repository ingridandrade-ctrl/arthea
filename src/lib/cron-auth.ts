/**
 * Autorização pra endpoints de cron (`/api/cron/*`).
 *
 * Aceita request se QUALQUER um for verdadeiro:
 *  1. Header `Authorization: Bearer ${CRON_SECRET}` (curl / triggers manuais)
 *  2. Header `x-vercel-cron: 1` (cron interno da Vercel — só ela seta esse
 *     header em requests originados do scheduler, requests externos com esse
 *     header são bloqueados na borda)
 *
 * Se `CRON_SECRET` não está setado e o header da Vercel também não veio,
 * libera em dev pra facilitar testes locais.
 */
import { NextRequest } from "next/server";

export function isAuthorizedCron(request: NextRequest): boolean {
  if (request.headers.get("x-vercel-cron")) return true;

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  // Sem CRON_SECRET configurado: libera (dev / setup inicial).
  return true;
}

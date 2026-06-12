// Refresh + cache do access token Google Ads.
// O refresh_token é eterno até ser revogado; o access_token expira em ~1h.
// Cacheamos o access em GoogleAdsConnection.accessToken/tokenExpiresAt
// pra não bater oauth2.googleapis.com a cada request.

import { prisma } from "@/lib/prisma";
import { getGoogleAdsConfig } from "./config";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SAFETY_MARGIN_MS = 5 * 60 * 1000; // renova 5 min antes de expirar

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

/**
 * Retorna um access token válido pra Google Ads. Reusa o cache em
 * GoogleAdsConnection se ainda não expirou (com margem); senão chama
 * oauth2.googleapis.com com o refresh token, persiste e retorna.
 */
export async function getValidAccessToken(connectionId: string): Promise<string> {
  const conn = await prisma.googleAdsConnection.findUnique({
    where: { id: connectionId },
    select: { id: true, accessToken: true, tokenExpiresAt: true, status: true },
  });
  if (!conn) throw new Error("Conexão Google Ads não encontrada");
  if (conn.status !== "ACTIVE") {
    throw new Error(`Conexão Google Ads está ${conn.status.toLowerCase()}`);
  }

  const now = Date.now();
  const expiresAt = conn.tokenExpiresAt?.getTime() ?? 0;
  if (conn.accessToken && expiresAt - SAFETY_MARGIN_MS > now) {
    return conn.accessToken;
  }

  // Refresh
  const { clientId, clientSecret, refreshToken } = getGoogleAdsConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    // Se o Google rejeitar o refresh, marcamos como EXPIRED pra deixar
    // claro no admin que precisa rodar o script de novo.
    await prisma.googleAdsConnection.update({
      where: { id: conn.id },
      data: { status: "EXPIRED" },
    });
    throw new Error(`Falha ao renovar access token Google Ads: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as TokenResponse;
  const expires = new Date(now + data.expires_in * 1000);

  await prisma.googleAdsConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: data.access_token,
      tokenExpiresAt: expires,
      status: "ACTIVE",
    },
  });

  return data.access_token;
}

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Autenticação simples por senha para o painel /mindfulness/painel.
 *
 * Fluxo:
 *   1. Usuária envia senha no POST /api/mindfulness/admin/login.
 *   2. Servidor compara com MINDFULNESS_ADMIN_PASSWORD (env).
 *   3. Se bater, seta cookie HttpOnly com token assinado por HMAC usando
 *      NEXTAUTH_SECRET. Sem o secret, ninguém forja o cookie.
 */

const COOKIE_NAME = "mindfulness_admin_v2";
const TOKEN_PAYLOAD = "ok"; // valor fixo — a presença válida do cookie já autentica
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET ausente — não é possível assinar o cookie do painel mindfulness.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function buildToken(): string {
  return `${TOKEN_PAYLOAD}.${sign(TOKEN_PAYLOAD)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (payload !== TOKEN_PAYLOAD || !signature) return false;
  const expected = sign(payload);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.MINDFULNESS_ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function setAdminCookie(): void {
  cookies().set({
    name: COOKIE_NAME,
    value: buildToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie(): void {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export function isAdminAuthenticated(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

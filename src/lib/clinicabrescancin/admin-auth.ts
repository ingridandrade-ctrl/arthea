import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Autenticação simples por senha pro painel /clinicabrescancin/admin.
 *
 * Fluxo:
 *   1. Usuário envia senha em POST /api/clinicabrescancin/admin/login.
 *   2. Servidor compara com BRESCANCIN_ADMIN_PASSWORD via timingSafeEqual.
 *   3. Se bater, seta cookie httpOnly com token assinado por HMAC usando
 *      NEXTAUTH_SECRET. Sem o secret, ninguém forja o cookie.
 */

const COOKIE_NAME = "brescancin_admin_v1";
const TOKEN_PAYLOAD = "ok";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET ausente — não é possível assinar o cookie do admin Brescancin.",
    );
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
  const expected = process.env.BRESCANCIN_ADMIN_PASSWORD;
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
    sameSite: "strict",
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

export function isBrescancinAdminAuthenticated(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifyToken(token);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getMeProfile,
  META_OAUTH_SCOPES,
} from "@/lib/meta/api";

const CONFIG_URL = "/configuracoes/meta";

function redirectWith(reason: string, request: NextRequest) {
  const url = new URL(CONFIG_URL, request.url);
  url.searchParams.set("status", reason);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session) return NextResponse.redirect(new URL("/login", request.url));
  const userId = session.user?.id;
  if (!userId) return redirectWith("unauthorized", request);

  const search = request.nextUrl.searchParams;
  const error = search.get("error");
  if (error) {
    console.error("Meta OAuth error:", error, search.get("error_description"));
    return redirectWith("denied", request);
  }

  const code = search.get("code");
  const state = search.get("state");
  const cookieState = request.cookies.get("meta_oauth_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWith("invalid_state", request);
  }

  try {
    const short = await exchangeCodeForToken(code);
    const long = await exchangeForLongLivedToken(short.accessToken);
    const profile = await getMeProfile(long.accessToken);

    const expiresAt = long.expiresIn ? new Date(Date.now() + long.expiresIn * 1000) : null;

    await prisma.metaConnection.upsert({
      where: { userId_metaUserId: { userId, metaUserId: profile.id } },
      create: {
        userId,
        metaUserId: profile.id,
        metaUserName: profile.name ?? null,
        accessToken: long.accessToken,
        tokenExpiresAt: expiresAt,
        scopes: META_OAUTH_SCOPES,
        status: "ACTIVE",
      },
      update: {
        accessToken: long.accessToken,
        tokenExpiresAt: expiresAt,
        scopes: META_OAUTH_SCOPES,
        metaUserName: profile.name ?? null,
        status: "ACTIVE",
      },
    });

    const response = redirectWith("connected", request);
    response.cookies.delete("meta_oauth_state");
    return response;
  } catch (err: any) {
    console.error("Meta OAuth callback failed:", err?.response?.data || err.message);
    return redirectWith("error", request);
  }
}

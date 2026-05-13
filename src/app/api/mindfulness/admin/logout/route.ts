import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/mindfulness/admin-auth";

export async function POST() {
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { runCronAutomations } from "@/lib/automations/engine";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runCronAutomations();
    return NextResponse.json({ status: "ok", executedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Cron execution error:", error);
    return NextResponse.json({ error: "Execution failed" }, { status: 500 });
  }
}

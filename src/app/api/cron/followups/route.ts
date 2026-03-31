import { NextRequest, NextResponse } from "next/server";
import { processDueFollowUps } from "@/lib/followups/engine";

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processDueFollowUps();

  return NextResponse.json({
    processed: results.length,
    results,
  });
}

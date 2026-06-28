import { NextRequest, NextResponse } from "next/server";
import { processDueFollowUps } from "@/lib/followups/engine";
import { isAuthorizedCron } from "@/lib/cron-auth";

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processDueFollowUps();

  return NextResponse.json({
    processed: results.length,
    results,
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

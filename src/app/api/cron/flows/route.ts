import { NextRequest, NextResponse } from "next/server";
import { processDueFlowSteps } from "@/lib/flows/engine";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await processDueFlowSteps();
  return NextResponse.json({ processed: results.length, results });
}

export async function GET(request: NextRequest) {
  return POST(request);
}

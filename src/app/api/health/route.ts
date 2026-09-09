import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Basic health-check endpoint. Confirms the API layer is functional.
 * Additional API routes will be added in future steps.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

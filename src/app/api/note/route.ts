import { NextRequest, NextResponse } from "next/server";
import { fetchEventsByIds } from "@/lib/nostr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json(
      { error: "Missing ids query param (comma-separated)" },
      { status: 400 }
    );
  }
  const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ notes: [] });
  }
  try {
    const notes = await fetchEventsByIds(ids);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Note API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

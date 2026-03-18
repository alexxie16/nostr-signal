import { NextRequest, NextResponse } from "next/server";
import { fetchEventsByIds, parseEventIdsParam } from "@/lib/nostr";

const MAX_NOTE_IDS = 50;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      { error: "Missing ids query param (comma-separated)" },
      { status: 400 }
    );
  }

  const ids = parseEventIdsParam(idsParam, MAX_NOTE_IDS);

  if (ids.length === 0) {
    return NextResponse.json(
      {
        error: "Provide at least one valid 64-character hex Nostr event id.",
      },
      { status: 400 }
    );
  }

  try {
    const notes = await fetchEventsByIds(ids);
    return NextResponse.json({ notes, requestedIds: ids });
  } catch (error) {
    console.error("Note API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

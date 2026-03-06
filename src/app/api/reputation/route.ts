import { NextRequest, NextResponse } from "next/server";
import { fetchNotes, fetchReactions, fetchZaps } from "@/lib/nostr";
import {
  aggregateSignals,
  computeReputation,
  parseWeights,
} from "@/lib/reputation";
import { MOCK_REPUTATIONS } from "@/lib/mock";

function applyWeightsToShops(
  shops: typeof MOCK_REPUTATIONS,
  weights: { activity: number; endorsement: number; zap: number }
) {
  return shops
    .map((s) => ({
      ...s,
      totalScore:
        weights.activity * s.activityScore +
        weights.endorsement * s.endorsementScore +
        weights.zap * s.zapScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? "madeira";
  const domain = searchParams.get("domain") ?? "beer-shop";
  const weights = parseWeights(
    searchParams.get("activityWeight") ?? undefined,
    searchParams.get("endorsementWeight") ?? undefined,
    searchParams.get("zapWeight") ?? undefined
  );
  const useMock = process.env.NOSTR_USE_MOCK === "true";

  if (useMock) {
    return NextResponse.json({
      location,
      domain,
      weights,
      useMock: true,
      shops: applyWeightsToShops(MOCK_REPUTATIONS, weights),
    });
  }

  try {
    const notes = await fetchNotes(location, domain);

    if (notes.length === 0) {
      return NextResponse.json({
        location,
        domain,
        weights,
        useMock: true,
        shops: applyWeightsToShops(MOCK_REPUTATIONS, weights),
        message: "No Nostr data found; returning mock data for demo.",
      });
    }

    const noteIds = notes.map((n) => n.id);
    const [reactions, zaps] = await Promise.all([
      fetchReactions(noteIds),
      fetchZaps(noteIds),
    ]);

    const signalsMap = aggregateSignals(notes, reactions, zaps, location, domain);

    if (signalsMap.size === 0) {
      return NextResponse.json({
        location,
        domain,
        weights,
        useMock: true,
        shops: applyWeightsToShops(MOCK_REPUTATIONS, weights),
        message: "No shop slugs found in notes; returning mock data for demo.",
      });
    }

    const shops = computeReputation(signalsMap, weights);

    return NextResponse.json({
      location,
      domain,
      weights,
      useMock: false,
      shops,
    });
  } catch (error) {
    console.error("Reputation API error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch reputation data",
        useMock: true,
        weights,
        shops: applyWeightsToShops(MOCK_REPUTATIONS, weights),
        message: "Error fetching from Nostr; returning mock data for demo.",
      },
      { status: 500 }
    );
  }
}

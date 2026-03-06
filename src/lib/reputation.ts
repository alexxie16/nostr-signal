import type { NostrEvent } from "./types";
import {
  extractShopSlugs,
  parseZapAmount,
} from "./nostr";
import type { ShopReputation, ShopSignals } from "./types";

/** Positive reaction content values (NIP-25) */
const POSITIVE_REACTIONS = new Set(["+", "❤", "❤️", "👍", "🤙", "⭐", "🔥"]);

function isPositiveReaction(content: string): boolean {
  const c = content.trim();
  return c === "" || POSITIVE_REACTIONS.has(c);
}

/** Normalize value to 0-1 using min-max, or return 0 if max is 0 */
function normalizeMinMax(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(1, value / max);
}

/** Convert slug to display name (e.g. cervejaria-joao -> Cervejaria Joao) */
function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Aggregate signals from Nostr events into per-shop counts.
 */
export function aggregateSignals(
  notes: NostrEvent[],
  reactions: NostrEvent[],
  zaps: NostrEvent[],
  location: string,
  domain: string
): Map<string, ShopSignals> {
  const noteIdToSlugs = new Map<string, string[]>();
  const slugToNoteIds = new Map<string, string[]>();

  for (const note of notes) {
    const slugs = extractShopSlugs(note, location, domain);
    if (slugs.length === 0) continue;
    noteIdToSlugs.set(note.id, slugs);
    for (const slug of slugs) {
      const ids = slugToNoteIds.get(slug) ?? [];
      ids.push(note.id);
      slugToNoteIds.set(slug, ids);
    }
  }

  const eventIdToTargetNoteId = new Map<string, string>();
  for (const r of reactions) {
    const eTag = r.tags.find((t) => t[0] === "e");
    if (eTag?.[1]) eventIdToTargetNoteId.set(r.id, eTag[1]);
  }
  for (const z of zaps) {
    const eTag = z.tags.find((t) => t[0] === "e");
    if (eTag?.[1]) eventIdToTargetNoteId.set(z.id, eTag[1]);
  }

  const slugToNoteIdsSet = new Map<string, Set<string>>();
  for (const [slug, ids] of slugToNoteIds) {
    slugToNoteIdsSet.set(slug, new Set(ids));
  }

  const signalsBySlug = new Map<string, ShopSignals>();

  for (const [slug, noteIdSet] of slugToNoteIdsSet) {
    const noteIds = [...noteIdSet];

    let reactionCount = 0;
    for (const r of reactions) {
      const target = eventIdToTargetNoteId.get(r.id);
      if (target && noteIdSet.has(target) && isPositiveReaction(r.content)) {
        reactionCount++;
      }
    }

    let zapCount = 0;
    let zapSatsTotal = 0;
    for (const z of zaps) {
      const target = eventIdToTargetNoteId.get(z.id);
      if (target && noteIdSet.has(target)) {
        zapCount++;
        const msats = parseZapAmount(z);
        zapSatsTotal += Math.round(msats / 1000);
      }
    }

    signalsBySlug.set(slug, {
      slug,
      noteIds,
      noteCount: noteIds.length,
      reactionCount,
      zapCount,
      zapSatsTotal,
    });
  }

  return signalsBySlug;
}

export interface RankingWeights {
  activity: number;
  endorsement: number;
  zap: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  activity: 0.5,
  endorsement: 0.3,
  zap: 0.2,
};

/** Normalize weights to sum to 1; fall back to defaults if invalid */
export function parseWeights(
  activity?: number | string,
  endorsement?: number | string,
  zap?: number | string
): RankingWeights {
  const a = typeof activity === "string" ? parseFloat(activity) : activity;
  const e = typeof endorsement === "string" ? parseFloat(endorsement) : endorsement;
  const z = typeof zap === "string" ? parseFloat(zap) : zap;
  if (
    typeof a === "number" &&
    !isNaN(a) &&
    typeof e === "number" &&
    !isNaN(e) &&
    typeof z === "number" &&
    !isNaN(z) &&
    a >= 0 &&
    e >= 0 &&
    z >= 0
  ) {
    const sum = a + e + z;
    if (sum > 0) {
      return {
        activity: a / sum,
        endorsement: e / sum,
        zap: z / sum,
      };
    }
  }
  return DEFAULT_WEIGHTS;
}

/**
 * Compute reputation scores with normalization and weighted formula.
 * Formula: activityWeight * activity + endorsementWeight * endorsement + zapWeight * zap
 */
export function computeReputation(
  signalsMap: Map<string, ShopSignals>,
  weights: RankingWeights = DEFAULT_WEIGHTS
): ShopReputation[] {
  const signals = [...signalsMap.values()];
  if (signals.length === 0) return [];

  const maxNotes = Math.max(1, ...signals.map((s) => s.noteCount));
  const maxReactions = Math.max(1, ...signals.map((s) => s.reactionCount));
  const maxZaps = Math.max(1, ...signals.map((s) => s.zapCount));
  const maxZapSats = Math.max(1, ...signals.map((s) => s.zapSatsTotal));

  const results: ShopReputation[] = [];

  for (const s of signals) {
    const activityScore = normalizeMinMax(s.noteCount, maxNotes);
    const endorsementScore = normalizeMinMax(s.reactionCount, maxReactions);
    const zapValue = Math.log1p(s.zapSatsTotal) + 0.5 * s.zapCount;
    const maxZapValue = Math.log1p(maxZapSats) + 0.5 * maxZaps;
    const zapScore = normalizeMinMax(zapValue, maxZapValue);

    const totalScore =
      weights.activity * activityScore +
      weights.endorsement * endorsementScore +
      weights.zap * zapScore;

    results.push({
      slug: s.slug,
      displayName: slugToDisplayName(s.slug),
      activityScore,
      endorsementScore,
      zapScore,
      totalScore,
      raw: s,
    });
  }

  results.sort((a, b) => b.totalScore - a.totalScore);
  return results;
}

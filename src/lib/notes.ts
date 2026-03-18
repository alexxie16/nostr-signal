import type { NostrEvent } from "./types";

const HEX_EVENT_ID_RE = /^[a-f0-9]{64}$/i;

export function normalizeHexEventIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const id of ids) {
    const trimmed = id.trim().toLowerCase();
    if (!HEX_EVENT_ID_RE.test(trimmed) || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function sortNotesByRequestedIds(notes: NostrEvent[], requestedIds: string[]): NostrEvent[] {
  const order = new Map(requestedIds.map((id, index) => [id, index]));

  return [...notes].sort((a, b) => {
    const aIndex = order.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = order.get(b.id) ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return b.created_at - a.created_at;
  });
}

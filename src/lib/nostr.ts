import { SimplePool } from "nostr-tools";
import type { NostrEvent } from "./types";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
];

function getRelays(): string[] {
  const env = process.env.NOSTR_RELAYS;
  if (env) {
    return env.split(",").map((r) => r.trim()).filter(Boolean);
  }
  return DEFAULT_RELAYS;
}

/** Returns true if the note has BOTH location and category in its t tags */
function hasRequiredTags(
  tags: string[][],
  location: string,
  domain: string
): boolean {
  const loc = location.toLowerCase().trim();
  const cat = domain.toLowerCase().trim();
  const tValues = tags
    .filter((t) => t[0] === "t" && t[1])
    .map((t) => t[1].toLowerCase().trim());
  return tValues.includes(loc) && tValues.includes(cat);
}

/** Fetch kind 1 notes that have BOTH location AND category in tags */
export async function fetchNotes(
  location: string,
  domain: string
): Promise<NostrEvent[]> {
  const pool = new SimplePool();
  const relays = getRelays();

  const filter = {
    kinds: [1],
    "#t": [location, domain],
    limit: 500,
  };

  const events = await pool.querySync(relays, filter);
  pool.close(relays);

  const filtered = events.filter((e) =>
    hasRequiredTags(e.tags, location, domain)
  );

  return filtered.map((e) => ({
    id: e.id,
    kind: e.kind,
    pubkey: e.pubkey,
    content: e.content,
    tags: e.tags,
    created_at: e.created_at,
    sig: e.sig,
  }));
}

/** Fetch kind 7 (reaction) events that reference the given event IDs */
export async function fetchReactions(
  eventIds: string[]
): Promise<NostrEvent[]> {
  if (eventIds.length === 0) return [];

  const pool = new SimplePool();
  const relays = getRelays();

  const filter = {
    kinds: [7],
    "#e": eventIds,
    limit: 1000,
  };

  const events = await pool.querySync(relays, filter);
  pool.close(relays);

  return events.map((e) => ({
    id: e.id,
    kind: e.kind,
    pubkey: e.pubkey,
    content: e.content,
    tags: e.tags,
    created_at: e.created_at,
    sig: e.sig,
  }));
}

/** Fetch kind 9735 (zap receipt) events that reference the given event IDs */
export async function fetchZaps(eventIds: string[]): Promise<NostrEvent[]> {
  if (eventIds.length === 0) return [];

  const pool = new SimplePool();
  const relays = getRelays();

  const filter = {
    kinds: [9735],
    "#e": eventIds,
    limit: 1000,
  };

  const events = await pool.querySync(relays, filter);
  pool.close(relays);

  return events.map((e) => ({
    id: e.id,
    kind: e.kind,
    pubkey: e.pubkey,
    content: e.content,
    tags: e.tags,
    created_at: e.created_at,
    sig: e.sig,
  }));
}

/** Extract shop slugs from a note's t tags (exclude location and domain) */
export function extractShopSlugs(
  note: NostrEvent,
  location: string,
  domain: string
): string[] {
  const tTags = note.tags.filter((t) => t[0] === "t" && t[1]);
  const slugs = tTags
    .map((t) => t[1].toLowerCase().trim())
    .filter((s) => s !== location && s !== domain);
  return [...new Set(slugs)];
}

/** Parse zap amount in millisatoshis from kind 9735 content (JSON with amount) */
export function parseZapAmount(zapEvent: NostrEvent): number {
  try {
    const parsed = JSON.parse(zapEvent.content);
    const amount = parsed?.amount ?? parsed?.msatoshi ?? 0;
    return typeof amount === "number" ? amount : 0;
  } catch {
    return 0;
  }
}

import { SimplePool, nip19 } from "nostr-tools";
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

function isHexId(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

/**
 * Normalize Nostr event IDs to lowercase hex and deduplicate them.
 */
export function normalizeEventIds(ids: string[]): string[] {
  const normalized = ids
    .map((id) => id.trim().toLowerCase())
    .filter((id) => isHexId(id));

  return [...new Set(normalized)];
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

/** Fetch kind 1 events by ID(s) */
export async function fetchEventsByIds(ids: string[]): Promise<NostrEvent[]> {
  const realIds = normalizeEventIds(ids);
  if (realIds.length === 0) return [];

  const pool = new SimplePool();
  const relays = getRelays();

  const filter = {
    kinds: [1],
    ids: realIds,
    limit: realIds.length,
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
  const normalizedLocation = location.toLowerCase().trim();
  const normalizedDomain = domain.toLowerCase().trim();
  const tTags = note.tags.filter((t) => t[0] === "t" && t[1]);
  const slugs = tTags
    .map((t) => t[1].toLowerCase().trim())
    .filter((s) => s !== normalizedLocation && s !== normalizedDomain);
  return [...new Set(slugs)];
}

function parseNumericValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function parseZapAmountFromJson(raw: string): number {
  try {
    const parsed = JSON.parse(raw);
    return (
      parseNumericValue(parsed?.amount) ||
      parseNumericValue(parsed?.msatoshi) ||
      parseNumericValue(parsed?.msats) ||
      0
    );
  } catch {
    return 0;
  }
}

/**
 * Parse zap amount in millisatoshis from a kind 9735 receipt.
 * Prefers receipt tags commonly used in NIP-57, then falls back to JSON payloads.
 */
export function parseZapAmount(zapEvent: NostrEvent): number {
  const amountTag = zapEvent.tags.find((tag) => tag[0] === "amount" && tag[1]);
  const amountFromTag = parseNumericValue(amountTag?.[1]);
  if (amountFromTag > 0) {
    return amountFromTag;
  }

  const descriptionTag = zapEvent.tags.find((tag) => tag[0] === "description" && tag[1]);
  const amountFromDescription = descriptionTag ? parseZapAmountFromJson(descriptionTag[1]) : 0;
  if (amountFromDescription > 0) {
    return amountFromDescription;
  }

  return parseZapAmountFromJson(zapEvent.content);
}

function isHexPubkey(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

/**
 * Normalize a user pubkey from hex or npub format.
 * Returns a lowercase hex pubkey, or null when the value is invalid.
 */
export function normalizeUserPubkey(value?: string | null): string | null {
  const input = value?.trim();
  if (!input) return null;

  if (isHexPubkey(input)) {
    return input.toLowerCase();
  }

  if (input.toLowerCase().startsWith("npub1")) {
    try {
      const decoded = nip19.decode(input);
      if (decoded.type === "npub" && typeof decoded.data === "string" && isHexPubkey(decoded.data)) {
        return decoded.data.toLowerCase();
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Fetch kind 3 (contact list) events for a list of pubkeys.
 * Returns a map of pubkey -> list of followed pubkeys.
 */
export async function fetchContactLists(
  pubkeys: string[]
): Promise<Map<string, Set<string>>> {
  if (pubkeys.length === 0) return new Map();

  const pool = new SimplePool();
  const relays = getRelays();

  const filter = {
    kinds: [3],
    authors: pubkeys,
    limit: pubkeys.length,
  };

  const events = await pool.querySync(relays, filter);
  pool.close(relays);

  const contactLists = new Map<string, Set<string>>();
  for (const event of events) {
    const followed = new Set<string>();
    for (const tag of event.tags) {
      if (tag[0] === "p" && tag[1]) {
        followed.add(tag[1]);
      }
    }
    contactLists.set(event.pubkey, followed);
  }

  return contactLists;
}

/**
 * Calculate trust scores for authors based on a user's follow graph.
 * userPubkey: the user's public key
 * authorPubkeys: list of author pubkeys to score
 * Returns: Map of pubkey -> trust score (0-1)
 *   - 1.0 = user follows directly
 *   - 0.75 = user follows someone who follows this author
 *   - 0.5 = neutral (default)
 *   - 0.25 = less trusted (user's follows don't follow this author)
 */
export async function calculateTrustScores(
  userPubkey: string,
  authorPubkeys: string[]
): Promise<Map<string, number>> {
  if (!userPubkey || authorPubkeys.length === 0) {
    return new Map(authorPubkeys.map((pk) => [pk, 0.5]));
  }

  const uniqueAuthors = [...new Set(authorPubkeys)];
  const allPubkeys = [userPubkey, ...uniqueAuthors];

  const contactLists = await fetchContactLists(allPubkeys);
  const userFollows = contactLists.get(userPubkey) ?? new Set();

  const trustScores = new Map<string, number>();

  for (const author of uniqueAuthors) {
    if (userFollows.has(author)) {
      trustScores.set(author, 1.0);
    } else {
      let foundIndirect = false;
      for (const followed of userFollows) {
        const followedList = contactLists.get(followed) ?? new Set();
        if (followedList.has(author)) {
          foundIndirect = true;
          break;
        }
      }
      trustScores.set(author, foundIndirect ? 0.75 : 0.5);
    }
  }

  return trustScores;
}

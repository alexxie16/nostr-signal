/** Nostr Event (subset we use) */
export interface NostrEvent {
  id: string;
  kind: number;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
  sig: string;
}

/** Raw signals aggregated from Nostr for a shop */
export interface ShopSignals {
  slug: string;
  noteIds: string[];
  noteCount: number;
  reactionCount: number;
  zapCount: number;
  zapSatsTotal: number;
  trustScore?: number; // Average trust score of note authors
}

/** Normalized and weighted reputation for a shop */
export interface ShopReputation {
  slug: string;
  displayName: string;
  activityScore: number;
  endorsementScore: number;
  zapScore: number;
  trustScore: number;
  totalScore: number;
  raw: ShopSignals;
}

/** Query params for reputation API */
export interface ReputationQuery {
  location: string;
  domain: string;
}

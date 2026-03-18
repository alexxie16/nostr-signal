import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeUserPubkey,
  orderEventsByRequestedIds,
  parseEventIdsParam,
  parseZapAmount,
} from "./nostr.ts";
import type { NostrEvent } from "./types.ts";

function createZapEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: "a".repeat(64),
    kind: 9735,
    pubkey: "b".repeat(64),
    content: "",
    tags: [],
    created_at: 1,
    sig: "c".repeat(128),
    ...overrides,
  };
}

function createNoteEvent(id: string, createdAt: number): NostrEvent {
  return {
    id,
    kind: 1,
    pubkey: "b".repeat(64),
    content: `note-${createdAt}`,
    tags: [],
    created_at: createdAt,
    sig: "c".repeat(128),
  };
}

test("parseZapAmount prefers the amount tag when present", () => {
  const event = createZapEvent({
    tags: [["amount", "21000"]],
    content: JSON.stringify({ amount: 1000 }),
  });

  assert.equal(parseZapAmount(event), 21000);
});

test("parseZapAmount reads amount from the description tag JSON", () => {
  const event = createZapEvent({
    tags: [["description", JSON.stringify({ amount: 42000 })]],
  });

  assert.equal(parseZapAmount(event), 42000);
});

test("parseZapAmount supports msatoshi fields in description JSON", () => {
  const event = createZapEvent({
    tags: [["description", JSON.stringify({ msatoshi: "56000" })]],
  });

  assert.equal(parseZapAmount(event), 56000);
});

test("parseZapAmount falls back to the event content JSON", () => {
  const event = createZapEvent({
    content: JSON.stringify({ msats: 78000 }),
  });

  assert.equal(parseZapAmount(event), 78000);
});

test("parseZapAmount returns zero for invalid payloads", () => {
  const event = createZapEvent({
    tags: [["description", "not-json"]],
    content: "still-not-json",
  });

  assert.equal(parseZapAmount(event), 0);
});

test("normalizeUserPubkey accepts lowercase hex pubkeys", () => {
  const pubkey = "f".repeat(64);
  assert.equal(normalizeUserPubkey(pubkey), pubkey);
});

test("normalizeUserPubkey normalizes npub values to hex", () => {
  const npub = "npub1lllllllllllllllllllllllllllllllllllllllllllllllllllsq7lrjw";
  assert.equal(normalizeUserPubkey(npub), "f".repeat(64));
});

test("normalizeUserPubkey rejects invalid values", () => {
  assert.equal(normalizeUserPubkey("hello world"), null);
  assert.equal(normalizeUserPubkey("npub1invalid"), null);
});

test("parseEventIdsParam keeps valid unique ids in input order", () => {
  const firstId = "A".repeat(64);
  const secondId = "b".repeat(64);
  const ids = parseEventIdsParam(` ${firstId},invalid,${secondId},${firstId} `);

  assert.deepEqual(ids, [firstId.toLowerCase(), secondId]);
});

test("parseEventIdsParam caps the number of ids", () => {
  const ids = Array.from({ length: 4 }, (_, index) => `${index.toString(16)}`.repeat(64)).join(",")
  const parsed = parseEventIdsParam(ids, 2);

  assert.equal(parsed.length, 2);
});

test("orderEventsByRequestedIds matches the requested note order", () => {
  const firstId = "1".repeat(64);
  const secondId = "2".repeat(64);
  const ordered = orderEventsByRequestedIds(
    [createNoteEvent(secondId, 20), createNoteEvent(firstId, 10)],
    [firstId, secondId]
  );

  assert.deepEqual(
    ordered.map((event) => event.id),
    [firstId, secondId]
  );
});

test("orderEventsByRequestedIds falls back to newest-first for unmatched notes", () => {
  const ordered = orderEventsByRequestedIds(
    [createNoteEvent("a".repeat(64), 10), createNoteEvent("b".repeat(64), 20)],
    []
  );

  assert.deepEqual(
    ordered.map((event) => event.created_at),
    [20, 10]
  );
});

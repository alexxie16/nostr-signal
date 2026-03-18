import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEventIds, normalizeUserPubkey, parseZapAmount } from "./nostr.ts";
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

test("normalizeEventIds lowercases, filters, and deduplicates ids", () => {
  const uppercaseId = "A".repeat(64);
  const lowercaseId = "b".repeat(64);

  assert.deepEqual(normalizeEventIds([
    uppercaseId,
    ` ${lowercaseId} `,
    uppercaseId.toLowerCase(),
    "mock1",
    "",
  ]), [uppercaseId.toLowerCase(), lowercaseId]);
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

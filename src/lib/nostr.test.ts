import test from "node:test";
import assert from "node:assert/strict";
import { nip19 } from "nostr-tools";

import { normalizeUserPubkey, parseZapAmount } from "./nostr.ts";
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

test("normalizeUserPubkey accepts lowercase hex pubkeys", () => {
  const pubkey = "f".repeat(64);
  assert.equal(normalizeUserPubkey(pubkey), pubkey);
});

test("normalizeUserPubkey normalizes npub values to hex", () => {
  const npub = "npub1lllllllllllllllllllllllllllllllllllllllllllllllllllsq7lrjw";
  assert.equal(normalizeUserPubkey(npub), "f".repeat(64));
});

test("normalizeUserPubkey accepts nostr: npub URIs", () => {
  const uri = "nostr:npub1lllllllllllllllllllllllllllllllllllllllllllllllllllsq7lrjw";
  assert.equal(normalizeUserPubkey(uri), "f".repeat(64));
});

test("normalizeUserPubkey extracts pubkeys from nprofile values", () => {
  const nprofile = nip19.nprofileEncode({ pubkey: "f".repeat(64), relays: ["wss://relay.example.com"] });
  assert.equal(normalizeUserPubkey(nprofile), "f".repeat(64));
});

test("normalizeUserPubkey accepts nostr: nprofile URIs", () => {
  const nprofile = nip19.nprofileEncode({ pubkey: "f".repeat(64) });
  assert.equal(normalizeUserPubkey(`nostr:${nprofile}`), "f".repeat(64));
});

test("normalizeUserPubkey rejects invalid values", () => {
  assert.equal(normalizeUserPubkey("hello world"), null);
  assert.equal(normalizeUserPubkey("npub1invalid"), null);
  assert.equal(normalizeUserPubkey("nostr:note1invalid"), null);
});

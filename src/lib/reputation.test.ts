import test from "node:test";
import assert from "node:assert/strict";

import { aggregateSignals, computeReputation, parseWeights } from "./reputation.ts";
import type { NostrEvent } from "./types.ts";

function createEvent(overrides: Partial<NostrEvent> = {}): NostrEvent {
  return {
    id: "a".repeat(64),
    kind: 1,
    pubkey: "b".repeat(64),
    content: "",
    tags: [],
    created_at: 1,
    sig: "c".repeat(128),
    ...overrides,
  };
}

test("parseWeights normalizes valid weights to sum to 1", () => {
  const weights = parseWeights(2, 1, 1, 0);

  assert.equal(weights.activity, 0.5);
  assert.equal(weights.endorsement, 0.25);
  assert.equal(weights.zap, 0.25);
  assert.equal(weights.trust, 0);
});

test("parseWeights falls back to defaults for invalid input", () => {
  const weights = parseWeights(-1, 1, 1, 1);

  assert.deepEqual(weights, {
    activity: 0.4,
    endorsement: 0.25,
    zap: 0.2,
    trust: 0.15,
  });
});

test("aggregateSignals groups notes by slug and counts only positive reactions", () => {
  const location = "madeira";
  const domain = "beer-shop";
  const noteOne = createEvent({
    id: "1".repeat(64),
    pubkey: "a".repeat(64),
    tags: [["t", location], ["t", domain], ["t", "cervejaria-joao"]],
  });
  const noteTwo = createEvent({
    id: "2".repeat(64),
    pubkey: "b".repeat(64),
    tags: [["t", location], ["t", domain], ["t", "cervejaria-joao"]],
  });
  const positiveReaction = createEvent({
    id: "3".repeat(64),
    kind: 7,
    content: "+",
    tags: [["e", noteOne.id]],
  });
  const negativeReaction = createEvent({
    id: "4".repeat(64),
    kind: 7,
    content: "-",
    tags: [["e", noteTwo.id]],
  });
  const zap = createEvent({
    id: "5".repeat(64),
    kind: 9735,
    content: JSON.stringify({ amount: 21000 }),
    tags: [["e", noteOne.id]],
  });

  const signals = aggregateSignals(
    [noteOne, noteTwo],
    [positiveReaction, negativeReaction],
    [zap],
    location,
    domain,
    new Map([
      [noteOne.pubkey, 1],
      [noteTwo.pubkey, 0.5],
    ])
  );

  assert.equal(signals.size, 1);

  const shop = signals.get("cervejaria-joao");
  assert.ok(shop);
  assert.equal(shop.noteCount, 2);
  assert.equal(shop.reactionCount, 1);
  assert.equal(shop.zapCount, 1);
  assert.equal(shop.zapSatsTotal, 21);
  assert.equal(shop.trustScore, 0.75);
});

test("computeReputation ranks higher-signal shops first", () => {
  const results = computeReputation(
    new Map([
      [
        "top-shop",
        {
          slug: "top-shop",
          noteIds: ["1".repeat(64), "2".repeat(64)],
          noteCount: 2,
          reactionCount: 3,
          zapCount: 2,
          zapSatsTotal: 200,
          trustScore: 1,
        },
      ],
      [
        "mid-shop",
        {
          slug: "mid-shop",
          noteIds: ["3".repeat(64)],
          noteCount: 1,
          reactionCount: 1,
          zapCount: 1,
          zapSatsTotal: 50,
          trustScore: 0.75,
        },
      ],
    ])
  );

  assert.equal(results.length, 2);
  assert.equal(results[0].slug, "top-shop");
  assert.equal(results[0].displayName, "Top Shop");
  assert.ok(results[0].totalScore > results[1].totalScore);
});

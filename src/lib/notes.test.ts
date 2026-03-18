import test from "node:test";
import assert from "node:assert/strict";

import { normalizeHexEventIds, sortNotesByRequestedIds } from "./notes.ts";
import type { NostrEvent } from "./types.ts";

function createNote(id: string, createdAt: number): NostrEvent {
  return {
    id,
    kind: 1,
    pubkey: "f".repeat(64),
    content: `note-${createdAt}`,
    tags: [],
    created_at: createdAt,
    sig: "a".repeat(128),
  };
}

test("normalizeHexEventIds keeps unique lowercase hex IDs in input order", () => {
  const validA = "A".repeat(64);
  const validB = "b".repeat(64);

  assert.deepEqual(normalizeHexEventIds([
    "",
    " mock-1 ",
    ` ${validA} `,
    validB,
    validA.toLowerCase(),
    "nostr:note1not-supported-here",
  ]), [validA.toLowerCase(), validB]);
});

test("sortNotesByRequestedIds follows requested ID order", () => {
  const noteA = createNote("a".repeat(64), 10);
  const noteB = createNote("b".repeat(64), 30);
  const noteC = createNote("c".repeat(64), 20);

  const sorted = sortNotesByRequestedIds([noteA, noteB, noteC], [noteC.id, noteA.id, noteB.id]);

  assert.deepEqual(sorted.map((note) => note.id), [noteC.id, noteA.id, noteB.id]);
});

test("sortNotesByRequestedIds falls back to newest first for unexpected IDs", () => {
  const requested = ["a".repeat(64)];
  const extraOlder = createNote("d".repeat(64), 5);
  const extraNewer = createNote("e".repeat(64), 50);

  const sorted = sortNotesByRequestedIds([extraOlder, extraNewer], requested);

  assert.deepEqual(sorted.map((note) => note.id), [extraNewer.id, extraOlder.id]);
});

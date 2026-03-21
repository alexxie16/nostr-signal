"use client";

import { SimplePool, type EventTemplate, type VerifiedEvent } from "nostr-tools";

const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
];

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: EventTemplate): Promise<VerifiedEvent>;
    };
  }
}

export function hasNostrExtension(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

export function normalizeShopSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function postNote(
  location: string,
  domain: string,
  shopName: string,
  content: string
): Promise<{ eventId: string; shopSlug: string } | { error: string }> {
  if (!window.nostr) {
    return { error: "Nostr extension not found. Install nos2x, Alby, or similar." };
  }

  const shopSlug = normalizeShopSlug(shopName);
  if (!shopSlug) {
    return { error: "Shop name must contain letters or numbers." };
  }

  const relayUrls =
    typeof process.env.NEXT_PUBLIC_NOSTR_RELAYS === "string"
      ? process.env.NEXT_PUBLIC_NOSTR_RELAYS.split(",").map((r) => r.trim()).filter(Boolean)
      : DEFAULT_RELAYS;

  const template: EventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["t", location],
      ["t", domain],
      ["t", shopSlug],
    ],
    content: content.trim(),
  };

  let signed: VerifiedEvent;
  try {
    signed = await window.nostr.signEvent(template);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to sign event";
    return { error: msg };
  }

  const pool = new SimplePool();
  try {
    const results = await Promise.allSettled(
      pool.publish(relayUrls, signed)
    );
    pool.close(relayUrls);
    const ok = results.some((r) => r.status === "fulfilled");
    if (!ok) {
      return { error: "Failed to publish to relays" };
    }
    return { eventId: signed.id, shopSlug };
  } catch (err) {
    pool.close(relayUrls);
    const msg = err instanceof Error ? err.message : "Publish failed";
    return { error: msg };
  }
}

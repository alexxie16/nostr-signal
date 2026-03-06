#!/usr/bin/env node
/**
 * Seed script: publishes sample kind 1 events for Madeira beer shops.
 * Run with: node scripts/seed-demo.mjs
 * Requires: NOSTR_SECRET_KEY env (hex) or generate a random key for demo.
 *
 * Events include t:madeira, t:beer-shop, and t:<shop-slug> tags.
 */
import { SimplePool, generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';

const RELAYS = ['wss://relay.damus.io', 'wss://relay.primal.net'];

const SHOPS = [
  { slug: 'cervejaria-joao', content: 'Best craft beer selection in Funchal! Cervejaria João has an amazing terrace. #madeira #beer' },
  { slug: 'bar-do-mar', content: 'Bar do Mar - great local brews by the sea. Highly recommend the Coral lager. #madeira #beer' },
  { slug: 'tasca-ribeira', content: 'Tasca Ribeira: authentic Madeiran spot with regional beers. Friendly staff! #madeira #beer' },
];

async function seed() {
  const secretKey = process.env.NOSTR_SECRET_KEY
    ? new Uint8Array(Buffer.from(process.env.NOSTR_SECRET_KEY, 'hex'))
    : generateSecretKey();

  const pubkey = getPublicKey(secretKey);
  console.log('Publishing as:', pubkey);

  const pool = new SimplePool();

  for (const shop of SHOPS) {
    const event = {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'madeira'],
        ['t', 'beer-shop'],
        ['t', shop.slug],
      ],
      content: shop.content,
    };

    const signed = finalizeEvent(event, secretKey);

    const published = await Promise.all(
      pool.publish(RELAYS, signed)
    );

    const ok = published.some((p) => p !== null && p !== undefined);
    console.log(ok ? `  ✓ ${shop.slug}` : `  ✗ ${shop.slug}`);
  }

  pool.close(RELAYS);
  console.log('Done. Events may take a few seconds to propagate.');
}

seed().catch(console.error);

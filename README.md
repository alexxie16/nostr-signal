# Local Spot from Nostr Signals

Discover trusted local spots via Nostr reputation signals. Example: finding good local beer shops in Madeira by aggregating Nostr signals.

## Reputation Formula

```
reputation = activityWeight × activity_score + endorsementWeight × endorsement_score + zapWeight × zap_score
```

Defaults: activity 0.5, endorsement 0.3, zap 0.2. Weights can be customized in the UI and are normalized to sum to 1.

- **activity_score**: Count of kind 1 notes mentioning the entity (by tag)
- **endorsement_score**: Count of kind 7 (reaction) events on those notes
- **zap_score**: Sum of Lightning zaps (kind 9735) on those notes

## Data Model

Entities (e.g. beer shops) are identified by Nostr `t` tags on kind 1 notes. **Both location and category must be present** in a note's tags for it to be included.

- `t:madeira` — location
- `t:beer-shop` — category  
- `t:cervejaria-joao` — unique shop identifier (slug)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), select location and category, adjust ranking weights if desired, then click Search. Results show `[mock]` prefix when using demo data.

## Posting

Use the "Post a recommendation" form to publish kind 1 notes with location, category, and shop tags. Requires a Nostr browser extension (e.g. [nos2x](https://github.com/nostr-protocol/nostr-extension), [Alby](https://getalby.com)).

Posting is done **client-side** via NIP-07: the extension signs the event, then the client publishes directly to relays. There is no server-side POST API.

## Environment

Copy `.env.example` to `.env.local` and adjust:

- `NOSTR_RELAYS` — Comma-separated relay URLs for server fetches
- `NEXT_PUBLIC_NOSTR_RELAYS` — Relay URLs for client-side posting
- `NOSTR_USE_MOCK` — Set to `true` to always use mock data

## API

```
GET /api/reputation?location=madeira&domain=beer-shop&activityWeight=0.5&endorsementWeight=0.3&zapWeight=0.2
```

Returns a ranked list of shops with reputation scores. Query params:

| Param              | Default   | Description                  |
|--------------------|-----------|------------------------------|
| `location`         | madeira   | Location tag filter (e.g. madeira, lisboa)          |
| `domain`           | beer-shop | Category tag filter (e.g. beer-shop, restaurant)          |
| `activityWeight`   | 0.5       | Weight for activity score    |
| `endorsementWeight`| 0.3       | Weight for endorsement score |
| `zapWeight`        | 0.2       | Weight for zap score         |

Weights are normalized to sum to 1.

### Note API

```
GET /api/note?ids=<id1>,<id2>,...
```

Returns kind 1 note events by ID. Used to fetch note content when viewing notes for a shop.

| Param | Required | Description                           |
|-------|----------|---------------------------------------|
| `ids` | Yes      | Comma-separated Nostr event IDs (hex) |

Response: `{ notes: NostrEvent[] }`

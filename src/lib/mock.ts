import type { ShopReputation } from "./types";

/** Demo mock data for Madeira beer shops when no real Nostr data exists */
export const MOCK_REPUTATIONS: ShopReputation[] = [
  {
    slug: "cervejaria-joao",
    displayName: "Cervejaria Joao",
    activityScore: 0.9,
    endorsementScore: 0.85,
    zapScore: 0.7,
    trustScore: 0.85,
    totalScore: 0.855,
    raw: {
      slug: "cervejaria-joao",
      noteIds: ["mock1", "mock2", "mock3"],
      noteCount: 12,
      reactionCount: 34,
      zapCount: 8,
      zapSatsTotal: 5000,
      trustScore: 0.85,
    },
  },
  {
    slug: "bar-do-mar",
    displayName: "Bar Do Mar",
    activityScore: 0.7,
    endorsementScore: 0.9,
    zapScore: 0.85,
    trustScore: 0.9,
    totalScore: 0.785,
    raw: {
      slug: "bar-do-mar",
      noteIds: ["mock4", "mock5"],
      noteCount: 8,
      reactionCount: 42,
      zapCount: 12,
      zapSatsTotal: 12000,
      trustScore: 0.9,
    },
  },
  {
    slug: "tasca-ribeira",
    displayName: "Tasca Ribeira",
    activityScore: 0.6,
    endorsementScore: 0.65,
    zapScore: 0.5,
    trustScore: 0.6,
    totalScore: 0.595,
    raw: {
      slug: "tasca-ribeira",
      noteIds: ["mock6"],
      noteCount: 5,
      reactionCount: 18,
      zapCount: 3,
      zapSatsTotal: 2000,
      trustScore: 0.6,
    },
  },
];

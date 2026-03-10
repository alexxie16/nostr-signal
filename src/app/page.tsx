"use client";

import { useState } from "react";
import { ShopCard } from "@/components/ShopCard";
import { PostForm } from "@/components/PostForm";
import { NotesModal } from "@/components/NotesModal";
import { InfoButton } from "@/components/ScoreInfo";
import type { ShopReputation } from "@/lib/types";

const LOCATIONS = ["madeira", "lisboa", "porto"];
const DOMAINS = ["beer-shop", "restaurant", "cafe"];

const DEFAULT_ACTIVITY_WEIGHT = 0.4;
const DEFAULT_ENDORSEMENT_WEIGHT = 0.25;
const DEFAULT_ZAP_WEIGHT = 0.2;
const DEFAULT_TRUST_WEIGHT = 0.15;

export default function Home() {
  const [location, setLocation] = useState("madeira");
  const [domain, setDomain] = useState("beer-shop");
  const [activityWeight, setActivityWeight] = useState(DEFAULT_ACTIVITY_WEIGHT);
  const [endorsementWeight, setEndorsementWeight] = useState(DEFAULT_ENDORSEMENT_WEIGHT);
  const [zapWeight, setZapWeight] = useState(DEFAULT_ZAP_WEIGHT);
  const [trustWeight, setTrustWeight] = useState(DEFAULT_TRUST_WEIGHT);
  const [shops, setShops] = useState<ShopReputation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState<boolean | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopReputation | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setShops(null);
    setUseMock(null);
    try {
      const params = new URLSearchParams({
        location,
        domain,
        activityWeight: String(activityWeight),
        endorsementWeight: String(endorsementWeight),
        zapWeight: String(zapWeight),
        trustWeight: String(trustWeight),
      });
      const res = await fetch(`/api/reputation?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setShops(data.shops ?? []);
      setUseMock(data.useMock ?? false);
    } catch (err) {
      console.error(err);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Local Spot from Nostr Signals
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find trusted local spots powered by Nostr web of trust
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="location"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Location
              </label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="domain"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Category
              </label>
              <select
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ranking weights
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label
                  htmlFor="activityWeight"
                  className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                >
                  Activity
                  <InfoButton scoreKey="activity" />
                </label>
                <input
                  id="activityWeight"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={activityWeight}
                  onChange={(e) => setActivityWeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="endorsementWeight"
                  className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                >
                  Endorsement
                  <InfoButton scoreKey="endorsement" />
                </label>
                <input
                  id="endorsementWeight"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={endorsementWeight}
                  onChange={(e) => setEndorsementWeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="zapWeight"
                  className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                >
                  Zap
                  <InfoButton scoreKey="zap" />
                </label>
                <input
                  id="zapWeight"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={zapWeight}
                  onChange={(e) => setZapWeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label
                  htmlFor="trustWeight"
                  className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
                >
                  Trust
                  <InfoButton scoreKey="trust" />
                </label>
                <input
                  id="trustWeight"
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={trustWeight}
                  onChange={(e) => setTrustWeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Weights are normalized to sum to 1
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Searching Nostr…" : "Search"}
          </button>
        </form>

        {useMock !== null && (
          <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {useMock
              ? "Using mock data (no Nostr events found for this tag)"
              : "Data from Nostr relays"}
          </p>
        )}

        <PostForm />

        {shops && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Ranked by reputation
            </h2>
            <div className="space-y-4">
              {shops.map((shop, i) => (
                <ShopCard
                  key={shop.slug}
                  shop={shop}
                  rank={i + 1}
                  isMocked={useMock ?? false}
                  onViewNotes={setSelectedShop}
                />
              ))}
            </div>
            {selectedShop && (
              <NotesModal shop={selectedShop} onClose={() => setSelectedShop(null)} />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

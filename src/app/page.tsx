"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShopCard } from "@/components/ShopCard";
import { PostForm } from "@/components/PostForm";
import { NotesModal } from "@/components/NotesModal";
import { InfoButton } from "@/components/ScoreInfo";
import type { ShopReputation } from "@/lib/types";

const LOCATIONS = ["madeira", "lisboa", "porto"];
const DOMAINS = ["beer-shop", "restaurant", "cafe"];

const DEFAULT_LOCATION = "madeira";
const DEFAULT_DOMAIN = "beer-shop";
const DEFAULT_ACTIVITY_WEIGHT = 0.5;
const DEFAULT_ENDORSEMENT_WEIGHT = 0.3;
const DEFAULT_ZAP_WEIGHT = 0.2;

function parseWeight(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initializedFromUrl = useRef(false);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [domain, setDomain] = useState(DEFAULT_DOMAIN);
  const [activityWeight, setActivityWeight] = useState(DEFAULT_ACTIVITY_WEIGHT);
  const [endorsementWeight, setEndorsementWeight] = useState(DEFAULT_ENDORSEMENT_WEIGHT);
  const [zapWeight, setZapWeight] = useState(DEFAULT_ZAP_WEIGHT);
  const [shops, setShops] = useState<ShopReputation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [useMock, setUseMock] = useState<boolean | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopReputation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = useCallback(
    async (nextState?: {
      location: string;
      domain: string;
      activityWeight: number;
      endorsementWeight: number;
      zapWeight: number;
    }) => {
      const paramsState = nextState ?? {
        location,
        domain,
        activityWeight,
        endorsementWeight,
        zapWeight,
      };

      setLoading(true);
      setShops(null);
      setUseMock(null);
      setMessage(null);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          location: paramsState.location,
          domain: paramsState.domain,
          activityWeight: String(paramsState.activityWeight),
          endorsementWeight: String(paramsState.endorsementWeight),
          zapWeight: String(paramsState.zapWeight),
        });

        router.replace(`/?${params.toString()}`, { scroll: false });

        const res = await fetch(`/api/reputation?${params}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Request failed");
        }

        setShops(data.shops ?? []);
        setUseMock(data.useMock ?? false);
        setMessage(data.message ?? null);
      } catch (err) {
        console.error(err);
        setShops([]);
        setUseMock(true);
        setErrorMessage(err instanceof Error ? err.message : "Failed to fetch reputation data");
      } finally {
        setLoading(false);
      }
    },
    [activityWeight, domain, endorsementWeight, location, router, zapWeight],
  );

  useEffect(() => {
    if (initializedFromUrl.current) return;
    initializedFromUrl.current = true;

    const paramsLocation = searchParams.get("location") ?? DEFAULT_LOCATION;
    const paramsDomain = searchParams.get("domain") ?? DEFAULT_DOMAIN;
    const nextState = {
      location: LOCATIONS.includes(paramsLocation) ? paramsLocation : DEFAULT_LOCATION,
      domain: DOMAINS.includes(paramsDomain) ? paramsDomain : DEFAULT_DOMAIN,
      activityWeight: parseWeight(searchParams.get("activityWeight"), DEFAULT_ACTIVITY_WEIGHT),
      endorsementWeight: parseWeight(searchParams.get("endorsementWeight"), DEFAULT_ENDORSEMENT_WEIGHT),
      zapWeight: parseWeight(searchParams.get("zapWeight"), DEFAULT_ZAP_WEIGHT),
    };

    setLocation(nextState.location);
    setDomain(nextState.domain);
    setActivityWeight(nextState.activityWeight);
    setEndorsementWeight(nextState.endorsementWeight);
    setZapWeight(nextState.zapWeight);

    if (["location", "domain", "activityWeight", "endorsementWeight", "zapWeight"].some((key) => searchParams.has(key))) {
      void runSearch(nextState);
    }
  }, [runSearch, searchParams]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runSearch();
  }

  function resetSearch() {
    setLocation(DEFAULT_LOCATION);
    setDomain(DEFAULT_DOMAIN);
    setActivityWeight(DEFAULT_ACTIVITY_WEIGHT);
    setEndorsementWeight(DEFAULT_ENDORSEMENT_WEIGHT);
    setZapWeight(DEFAULT_ZAP_WEIGHT);
    setShops(null);
    setUseMock(null);
    setSelectedShop(null);
    setMessage(null);
    setErrorMessage(null);
    router.replace("/", { scroll: false });
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Local Spot from Nostr Signals
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find trusted local spots powered by Nostr
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
            <div className="grid gap-3 sm:grid-cols-3">
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
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Weights are normalized to sum to 1
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? "Searching Nostr…" : "Search"}
            </button>
            <button
              type="button"
              onClick={resetSearch}
              disabled={loading}
              className="w-full rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Searches update the page URL so you can bookmark or share the exact view.
          </p>
        </form>

        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {useMock !== null && (
          <div className="mb-4 space-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {useMock
                ? "Using mock data (no Nostr events found for this tag)"
                : "Data from Nostr relays"}
            </p>
            {message && <p>{message}</p>}
          </div>
        )}

        <PostForm />

        {shops && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Ranked by reputation
            </h2>
            {shops.length > 0 ? (
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
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                No matching spots were found for this search.
              </div>
            )}
            {selectedShop && (
              <NotesModal shop={selectedShop} onClose={() => setSelectedShop(null)} />
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400 sm:px-6 lg:px-8">
            Loading…
          </div>
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}

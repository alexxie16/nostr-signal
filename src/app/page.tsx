"use client";

import { useMemo, useState } from "react";
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

type SearchStatus =
  | { type: "success"; text: string }
  | { type: "warning"; text: string }
  | { type: "error"; text: string };

interface ReputationResponse {
  shops?: ShopReputation[];
  useMock?: boolean;
  message?: string;
  error?: string;
}

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
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null);

  const rawWeightSum = activityWeight + endorsementWeight + zapWeight + trustWeight;
  const hasPositiveWeight = rawWeightSum > 0;

  const normalizedWeights = useMemo(() => {
    if (!hasPositiveWeight) {
      return {
        activity: 0,
        endorsement: 0,
        zap: 0,
        trust: 0,
      };
    }

    return {
      activity: activityWeight / rawWeightSum,
      endorsement: endorsementWeight / rawWeightSum,
      zap: zapWeight / rawWeightSum,
      trust: trustWeight / rawWeightSum,
    };
  }, [activityWeight, endorsementWeight, zapWeight, trustWeight, hasPositiveWeight, rawWeightSum]);

  function resetWeights() {
    setActivityWeight(DEFAULT_ACTIVITY_WEIGHT);
    setEndorsementWeight(DEFAULT_ENDORSEMENT_WEIGHT);
    setZapWeight(DEFAULT_ZAP_WEIGHT);
    setTrustWeight(DEFAULT_TRUST_WEIGHT);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    if (!hasPositiveWeight) {
      setSearchStatus({
        type: "error",
        text: "At least one ranking weight must be greater than 0.",
      });
      return;
    }

    setLoading(true);
    setShops(null);
    setUseMock(null);
    setSearchStatus(null);
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
      const data: ReputationResponse = await res.json();

      const nextShops = data.shops ?? [];
      const nextUseMock = data.useMock ?? false;

      setShops(nextShops);
      setUseMock(nextUseMock);

      if (!res.ok) {
        if (nextShops.length > 0) {
          setSearchStatus({
            type: "warning",
            text:
              data.message ?? data.error ?? "Nostr relays failed, so mock results are shown instead.",
          });
          return;
        }
        throw new Error(data.error ?? data.message ?? "Request failed");
      }

      if (data.message) {
        setSearchStatus({
          type: nextUseMock ? "warning" : "success",
          text: data.message,
        });
      } else if (nextUseMock) {
        setSearchStatus({
          type: "warning",
          text: "No Nostr events matched yet, so mock results are shown for now.",
        });
      } else {
        setSearchStatus({
          type: "success",
          text: "Fetched fresh rankings from Nostr relays.",
        });
      }
    } catch (err) {
      console.error(err);
      setShops([]);
      setSearchStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to fetch reputation data",
      });
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
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ranking weights
              </p>
              <button
                type="button"
                onClick={resetWeights}
                className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                Reset defaults
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <WeightInput
                id="activityWeight"
                label="Activity"
                scoreKey="activity"
                value={activityWeight}
                normalizedValue={normalizedWeights.activity}
                onChange={setActivityWeight}
              />
              <WeightInput
                id="endorsementWeight"
                label="Endorsement"
                scoreKey="endorsement"
                value={endorsementWeight}
                normalizedValue={normalizedWeights.endorsement}
                onChange={setEndorsementWeight}
              />
              <WeightInput
                id="zapWeight"
                label="Zap"
                scoreKey="zap"
                value={zapWeight}
                normalizedValue={normalizedWeights.zap}
                onChange={setZapWeight}
              />
              <WeightInput
                id="trustWeight"
                label="Trust"
                scoreKey="trust"
                value={trustWeight}
                normalizedValue={normalizedWeights.trust}
                onChange={setTrustWeight}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Raw total: {rawWeightSum.toFixed(2)}. Search normalizes these values to 100%.
              </p>
              {!hasPositiveWeight && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Set at least one weight above 0 to run a search.
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !hasPositiveWeight}
            className="mt-4 w-full rounded-md bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Searching Nostr…" : "Search"}
          </button>
        </form>

        {searchStatus && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              searchStatus.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-200"
                : searchStatus.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
            }`}
            role="status"
            aria-live="polite"
          >
            {searchStatus.text}
          </div>
        )}

        {useMock !== null && (
          <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {useMock
              ? "Using mock data while Nostr results are missing or unavailable"
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

function WeightInput({
  id,
  label,
  scoreKey,
  value,
  normalizedValue,
  onChange,
}: {
  id: string;
  label: string;
  scoreKey: "activity" | "endorsement" | "zap" | "trust";
  value: number;
  normalizedValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 flex items-center text-xs text-gray-500 dark:text-gray-400"
      >
        {label}
        <InfoButton scoreKey={scoreKey} />
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={1}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
      />
      <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        Normalized: {Math.round(normalizedValue * 100)}%
      </p>
    </div>
  );
}

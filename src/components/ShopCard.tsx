import type { ShopReputation } from "@/lib/types";

interface ShopCardProps {
  shop: ShopReputation;
  rank: number;
  isMocked?: boolean;
}

export function ShopCard({ shop, rank, isMocked }: ShopCardProps) {
  const scorePercent = (n: number) => Math.round(n * 100);
  const displayName = isMocked ? `[mock] ${shop.displayName}` : shop.displayName;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {rank}
            </span>
            <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {displayName}
            </h3>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {shop.raw.noteCount} notes · {shop.raw.reactionCount} reactions ·{" "}
            {shop.raw.zapCount} zaps ({shop.raw.zapSatsTotal} sats)
          </p>
          <div className="mt-3 space-y-2">
            <ScoreBar label="Activity" value={shop.activityScore} />
            <ScoreBar label="Endorsement" value={shop.endorsementScore} />
            <ScoreBar label="Zap" value={shop.zapScore} />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-lg font-bold text-white">
            {scorePercent(shop.totalScore)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-amber-400 dark:bg-amber-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

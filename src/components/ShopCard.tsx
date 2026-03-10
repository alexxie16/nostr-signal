import type { ShopReputation } from "@/lib/types";
import { InfoButton } from "@/components/ScoreInfo";

interface ShopCardProps {
  shop: ShopReputation;
  rank: number;
  isMocked?: boolean;
  onViewNotes?: (shop: ShopReputation) => void;
}

export function ShopCard({ shop, rank, isMocked, onViewNotes }: ShopCardProps) {
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
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {shop.raw.noteCount > 0 ? (
              <button
                type="button"
                onClick={() => onViewNotes?.(shop)}
                className="font-medium text-amber-600 hover:underline dark:text-amber-400"
              >
                {shop.raw.noteCount} notes
              </button>
            ) : (
              <span>0 notes</span>
            )}{" "}
            · {shop.raw.reactionCount} reactions · {shop.raw.zapCount} zaps (
            {shop.raw.zapSatsTotal} sats)
          </div>
          <div className="mt-3 space-y-2">
            <ScoreBar label="Activity" value={shop.activityScore} scoreKey="activity" />
            <ScoreBar label="Endorsement" value={shop.endorsementScore} scoreKey="endorsement" />
            <ScoreBar label="Zap" value={shop.zapScore} scoreKey="zap" />
            <ScoreBar label="Trust" value={shop.trustScore} scoreKey="trust" />
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

function ScoreBar({
  label,
  value,
  scoreKey,
}: {
  label: string;
  value: number;
  scoreKey: "activity" | "endorsement" | "zap" | "trust";
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center">
          {label}
          <InfoButton scoreKey={scoreKey} />
        </span>
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

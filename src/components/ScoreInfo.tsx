"use client";

import { useState, useEffect, useRef } from "react";

export const SCORE_EXPLANATIONS = {
  activity:
    "Count of Nostr notes (kind 1) mentioning this spot with matching location and category tags. Normalized 0–1 by the max count.",
  endorsement:
    "Count of positive reactions (likes, hearts, etc.) on those notes. Normalized 0–1.",
  zap: "Sum of Lightning zaps (sats) and zap count on those notes. Uses a log scale. Normalized 0–1.",
  trust: "Average trust score of note authors based on Nostr web of trust. 1.0 = directly followed, 0.75 = followed by someone you follow, 0.5 = neutral. Helps surface recommendations from trusted sources.",
} as const;

const SCORE_TITLES: Record<keyof typeof SCORE_EXPLANATIONS, string> = {
  activity: "Activity Score",
  endorsement: "Endorsement Score",
  zap: "Zap Score",
  trust: "Trust Score",
};

type ScoreKey = keyof typeof SCORE_EXPLANATIONS;

interface InfoButtonProps {
  scoreKey: ScoreKey;
}

export function InfoButton({ scoreKey }: InfoButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const title = SCORE_TITLES[scoreKey];
  const text = SCORE_EXPLANATIONS[scoreKey];

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
        aria-label={`Info about ${scoreKey}`}
      >
        i
      </button>
      {open && (
        <div
          className="absolute left-6 top-0 z-50 w-72 rounded-lg border border-gray-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-600/80 dark:bg-gray-800/95"
          role="dialog"
          aria-modal="true"
          aria-labelledby="score-info-title"
        >
          <h3
            id="score-info-title"
            className="mb-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}

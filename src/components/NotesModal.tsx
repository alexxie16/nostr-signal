"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShopReputation } from "@/lib/types";
import type { NostrEvent } from "@/lib/types";
import { normalizeHexEventIds, sortNotesByRequestedIds } from "@/lib/notes";

interface NotesModalProps {
  shop: ShopReputation;
  onClose: () => void;
}

const NOSTR_EVENT_PREFIX = "https://njump.me/";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortPubkey(pk: string) {
  return `${pk.slice(0, 8)}…${pk.slice(-4)}`;
}

export function NotesModal({ shop, onClose }: NotesModalProps) {
  const requestedIds = useMemo(() => normalizeHexEventIds(shop.raw.noteIds), [shop.raw.noteIds]);
  const missingRequestedCount = Math.max(shop.raw.noteCount - requestedIds.length, 0);
  const [notes, setNotes] = useState<NostrEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const abortController = new AbortController();

    setLoading(true);
    setNotes(null);
    setErrorMessage(null);

    if (requestedIds.length === 0) {
      setNotes([]);
      setLoading(false);
      return () => abortController.abort();
    }

    void fetch(`/api/note?ids=${requestedIds.join(",")}`, { signal: abortController.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load notes from relays.");
        }

        const fetchedNotes = Array.isArray(data.notes) ? data.notes : [];
        setNotes(sortNotesByRequestedIds(fetchedNotes, requestedIds));
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        console.error(error);
        setNotes([]);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load notes from relays.");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [requestedIds]);

  const fetchedCount = notes?.length ?? 0;
  const unresolvedCount = Math.max(requestedIds.length - fetchedCount, 0);
  const totalUnavailableCount = unresolvedCount + missingRequestedCount;
  const isMockData = shop.raw.noteIds.some((id) => id.startsWith("mock"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notes-modal-title"
    >
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h2
              id="notes-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Notes — {shop.displayName}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Showing {fetchedCount} of {shop.raw.noteCount} referenced notes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading notes…</p>
          ) : errorMessage ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <p>{errorMessage}</p>
              <p className="text-xs text-red-600/90 dark:text-red-300/80">
                Try reopening the modal or checking relay connectivity.
              </p>
            </div>
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
              {totalUnavailableCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
                  {totalUnavailableCount} referenced note{totalUnavailableCount === 1 ? " was" : "s were"} unavailable.
                  {missingRequestedCount > 0 && (
                    <span>
                      {" "}Some note IDs were not valid 64-character event IDs.
                    </span>
                  )}
                </div>
              )}
              {notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span title={note.pubkey}>{shortPubkey(note.pubkey)}</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {note.content}
                  </p>
                  <a
                    href={`${NOSTR_EVENT_PREFIX}${note.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-amber-600 hover:underline dark:text-amber-400"
                  >
                    View on Nostr →
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isMockData
                ? "Demo data — notes are not stored on relays."
                : totalUnavailableCount > 0
                  ? "No relay notes could be loaded for these references."
                  : "No notes found."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

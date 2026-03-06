"use client";

import { useState, useEffect } from "react";
import type { ShopReputation } from "@/lib/types";
import type { NostrEvent } from "@/lib/types";

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
  const [notes, setNotes] = useState<NostrEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    const ids = shop.raw.noteIds;
    const realIds = ids.filter((id) => id.length === 64 && /^[a-f0-9]+$/.test(id));
    if (realIds.length === 0) {
      setNotes([]);
      setLoading(false);
      return;
    }
    fetch(`/api/note?ids=${realIds.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setNotes(data.notes ?? []);
      })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [shop.raw.noteIds]);

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
          <h2
            id="notes-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Notes — {shop.displayName}
          </h2>
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
          ) : notes && notes.length > 0 ? (
            <div className="space-y-4">
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
              {shop.raw.noteIds.some((id) => id.startsWith("mock"))
                ? "Demo data — notes are not stored on relays."
                : "No notes found."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

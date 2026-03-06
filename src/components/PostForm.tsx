"use client";

import { useState } from "react";
import { hasNostrExtension, postNote } from "@/lib/postNostr";

const LOCATIONS = ["madeira", "lisboa", "porto"];
const DOMAINS = ["beer-shop", "restaurant", "cafe"];

export function PostForm() {
  const [location, setLocation] = useState("madeira");
  const [domain, setDomain] = useState("beer-shop");
  const [shopSlug, setShopSlug] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasExtension = hasNostrExtension();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!shopSlug.trim()) {
      setMessage({ type: "error", text: "Shop name is required" });
      return;
    }
    if (!content.trim()) {
      setMessage({ type: "error", text: "Content is required" });
      return;
    }
    setLoading(true);
    try {
      const result = await postNote(location, domain, shopSlug.trim(), content);
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `Posted! Event ID: ${result.eventId.slice(0, 16)}…` });
        setContent("");
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to post",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Post a recommendation
      </h2>
      {!hasExtension ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Install a Nostr extension (e.g.{" "}
            <a
              href="https://github.com/nostr-protocol/nostr-extension"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              nos2x
            </a>
            ,{" "}
            <a
              href="https://getalby.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              Alby
            </a>
            ) to post recommendations.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="post-location"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Location
              </label>
              <select
                id="post-location"
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
                htmlFor="post-domain"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Category
              </label>
              <select
                id="post-domain"
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
          <div className="mt-4">
            <label
              htmlFor="post-shop"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Shop name (slug, e.g. cervejaria-joao)
            </label>
            <input
              id="post-shop"
              type="text"
              value={shopSlug}
              onChange={(e) => setShopSlug(e.target.value)}
              placeholder="cervejaria-joao"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="post-content"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your recommendation
            </label>
            <textarea
              id="post-content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Great craft beer selection and terrace views!"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
          {message && (
            <p
              className={`mt-4 text-sm ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-md bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Posting to Nostr…" : "Post to Nostr"}
          </button>
        </form>
      )}
    </section>
  );
}

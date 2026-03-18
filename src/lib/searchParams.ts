export const LOCATIONS = ["madeira", "lisboa", "porto"] as const;
export const DOMAINS = ["beer-shop", "restaurant", "cafe"] as const;

export const DEFAULT_LOCATION = LOCATIONS[0];
export const DEFAULT_DOMAIN = DOMAINS[0];

function normalizeSearchValue(value?: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

export function parseSearchOption<T extends readonly string[]>(
  value: string | null | undefined,
  options: T,
  fallback: T[number],
): T[number] {
  const normalized = normalizeSearchValue(value);
  return (options as readonly string[]).includes(normalized) ? (normalized as T[number]) : fallback;
}

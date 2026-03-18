import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_DOMAIN,
  DEFAULT_LOCATION,
  DOMAINS,
  LOCATIONS,
  parseSearchOption,
} from "./searchParams.ts";

test("parseSearchOption normalizes case and surrounding whitespace", () => {
  assert.equal(parseSearchOption("  Madeira ", LOCATIONS, DEFAULT_LOCATION), "madeira");
  assert.equal(parseSearchOption(" RESTAURANT ", DOMAINS, DEFAULT_DOMAIN), "restaurant");
});

test("parseSearchOption falls back when the value is unsupported", () => {
  assert.equal(parseSearchOption("berlin", LOCATIONS, DEFAULT_LOCATION), DEFAULT_LOCATION);
  assert.equal(parseSearchOption("beer shop", DOMAINS, DEFAULT_DOMAIN), DEFAULT_DOMAIN);
  assert.equal(parseSearchOption(null, DOMAINS, DEFAULT_DOMAIN), DEFAULT_DOMAIN);
});

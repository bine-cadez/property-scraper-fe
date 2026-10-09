import { describe, expect, it } from "vitest";
import type { Listing } from "../../shared/types/property";
import {
  formatListingPrice,
  isListingStale,
  listingKindFromId,
  listingPricePerM2,
} from "../../shared/utils/listings";

const listing = {
  price: 225_000,
  priceUnit: "total",
  areaM2: 45,
} as Listing;

describe("listing presentation helpers", () => {
  it("derives the detail endpoint from IDs containing colons", () => {
    expect(listingKindFromId("re-max:sale:490111018-91")).toBe("sales");
    expect(listingKindFromId("kw:rent:abc:def")).toBe("rentals");
  });

  it("always includes the advertised price unit", () => {
    expect(formatListingPrice(1_200, "month")).toContain("/ mesec");
    expect(formatListingPrice(745_000, "day", "sale")).toContain(
      "enota cene ni zanesljiva",
    );
    expect(formatListingPrice(null, "unknown")).toBe("Cena ni objavljena");
  });

  it("calculates price per square metre only for total prices", () => {
    expect(listingPricePerM2(listing)).toBe(5_000);
    expect(
      listingPricePerM2({ ...listing, priceUnit: "month" }),
    ).toBeUndefined();
  });

  it("flags records not confirmed within 24 hours", () => {
    const now = Date.parse("2026-10-09T12:00:00Z");
    expect(isListingStale("2026-10-08T11:59:59Z", now)).toBe(true);
    expect(isListingStale("2026-10-08T12:00:01Z", now)).toBe(false);
  });
});

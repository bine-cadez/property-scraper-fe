import type {
  Listing,
  ListingPriceUnit,
  ListingTransactionType,
} from "../types/property";

const priceFormatter = new Intl.NumberFormat("sl-SI", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const unitLabels: Record<ListingPriceUnit, string> = {
  total: "",
  month: " / mesec",
  week: " / teden",
  day: " / dan",
  m2: " / m²",
  unknown: " / obdobje ni znano",
};

export function formatListingPrice(
  price: number | null,
  unit: ListingPriceUnit,
  transactionType?: ListingTransactionType,
): string {
  if (price === null) return "Cena ni objavljena";
  if (transactionType === "sale" && unit === "day") {
    return `${priceFormatter.format(price)} · enota cene ni zanesljiva`;
  }
  return `${priceFormatter.format(price)}${unitLabels[unit]}`;
}

export function listingPricePerM2(listing: Listing): number | undefined {
  return listing.priceUnit === "total" &&
    listing.price !== null &&
    listing.areaM2 !== null &&
    listing.areaM2 > 0
    ? listing.price / listing.areaM2
    : undefined;
}

export function listingKindFromId(id: string): "sales" | "rentals" | undefined {
  const transactionType = id.split(":")[1] as
    ListingTransactionType | undefined;
  if (transactionType === "sale") return "sales";
  if (transactionType === "rent") return "rentals";
}

export function isListingStale(lastSeenAt: string, now = Date.now()): boolean {
  const seenAt = Date.parse(lastSeenAt);
  return Number.isFinite(seenAt) && now - seenAt > 24 * 60 * 60 * 1000;
}

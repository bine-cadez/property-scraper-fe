import type { H3Event } from "h3";

export type ListingCollection = "sales" | "rentals";

const listingCollections = new Set<ListingCollection>(["sales", "rentals"]);
const listingQueryKeys = new Set([
  "source",
  "propertyType",
  "priceUnit",
  "priceMin",
  "priceMax",
  "areaMin",
  "areaMax",
  "bbox",
  "dedupe",
  "active",
  "limit",
  "cursor",
]);

export function listingCollection(event: H3Event): ListingCollection {
  const value = getRouterParam(event, "kind") as ListingCollection;
  if (!listingCollections.has(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Neveljavna vrsta oglasov.",
    });
  }
  return value;
}

export function listingQuery(event: H3Event, tile = false) {
  const query = getQuery(event);
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (
      listingQueryKeys.has(key) &&
      !(tile && ["active", "limit", "cursor"].includes(key)) &&
      typeof value === "string"
    ) {
      result[key] = value;
    }
  }
  return result;
}

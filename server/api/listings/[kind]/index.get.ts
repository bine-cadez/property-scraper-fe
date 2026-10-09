import type { ListingListResponse } from "#shared/types/property";
import { gursGet } from "../../../utils/gurs-api";
import { listingCollection, listingQuery } from "../../../utils/listings";

export default defineEventHandler(async (event) => {
  const kind = listingCollection(event);
  const response = await gursGet<ListingListResponse>(
    event,
    `/listings/${kind}`,
    { query: listingQuery(event) },
  );
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=3600",
  );
  return response;
});

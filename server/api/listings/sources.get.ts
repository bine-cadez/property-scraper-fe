import type { ListingSourcesResponse } from "#shared/types/property";
import { gursGet } from "../../utils/gurs-api";

export default defineEventHandler(async (event) => {
  const response = await gursGet<ListingSourcesResponse>(
    event,
    "/listings/sources",
  );
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=3600",
  );
  return response;
});

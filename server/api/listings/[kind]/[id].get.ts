import type { Listing } from "#shared/types/property";
import { gursGet } from "../../../utils/gurs-api";
import { listingCollection } from "../../../utils/listings";

export default defineEventHandler(async (event) => {
  const kind = listingCollection(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Manjka identifikator oglasa.",
    });
  }
  const listing = await gursGet<Listing>(
    event,
    `/listings/${kind}/${encodeURIComponent(id)}`,
  );
  setHeader(
    event,
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=3600",
  );
  return listing;
});

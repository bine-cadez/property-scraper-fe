import { gursListingTile } from "../../../../../../utils/gurs-api";
import {
  listingCollection,
  listingQuery,
} from "../../../../../../utils/listings";

export default defineEventHandler(async (event) => {
  const kind = listingCollection(event);
  const z = Number(getRouterParam(event, "z"));
  const x = Number(getRouterParam(event, "x"));
  const rawY =
    getRouterParam(event, "y.mvt") || getRouterParam(event, "y") || "";
  const y = Number(rawY.replace(/\.mvt$/, ""));

  if (
    !Number.isInteger(z) ||
    z < 0 ||
    z > 22 ||
    !Number.isInteger(x) ||
    x < 0 ||
    x >= 2 ** z ||
    !Number.isInteger(y) ||
    y < 0 ||
    y >= 2 ** z
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Neveljaven MVT tile.",
    });
  }

  const tile = await gursListingTile(
    event,
    kind,
    z,
    x,
    y,
    listingQuery(event, true),
  );
  return new Response(tile.body, {
    headers: {
      "Content-Type": "application/vnd.mapbox-vector-tile",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
});

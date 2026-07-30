# Data-source architecture

## Boundary

Vue components depend on domain contracts and Nuxt BFF responses, never on a GURS response shape or fixture module. Repository contracts cover properties, parcels, buildings, property units, transactions, listings, valuations, and geocoding.

```text
Vue / MapLibre
    ↓ typed `/api/*` responses
Nuxt server routes (limits, cancellation boundary, cache policy)
    ↓ repository contracts
Fixture adapters today
GURS / ETN / licensed listing / PostGIS adapters later
```

## Planned official integrations

1. Prefer GURS OGC API Features or WFS for bounded vector queries.
2. Use official WMS/WMTS only for appropriate raster layers and preserve required attribution.
3. Fetch by viewport/bounding box on the server, with a spatial limit, timeout, cache key, and upstream cancellation.
4. Normalize SI-D96/TM (`EPSG:3794`) geometries to WGS84 on the server through `shared/utils/coordinates.ts`.
5. Map upstream source metadata to `DataSource`, `sourceUpdatedAt`, and quality fields before returning data.
6. Connect ETN only under applicable access and publication terms.
7. Connect listing providers only after written reuse terms permit display, caching, and linking.

The app does not scrape `https://ipi.eprostor.gov.si/jv/`, attempt a national WFS download from the browser, or expose provider secrets to client bundles.

## Mocked versus live

| Capability                           | MVP status                                                   |
| ------------------------------------ | ------------------------------------------------------------ |
| Parcel polygons and facts            | Typed fixtures                                               |
| Building footprints and facts        | Typed fixtures                                               |
| Property units                       | Typed fixtures                                               |
| Official assessed values             | Typed fixtures, explicitly labelled                          |
| Calculated market estimates          | Typed fixtures with confidence and factors                   |
| Completed ETN transactions           | Typed fixtures, explicitly labelled                          |
| Active listings                      | Typed fixtures marked as a stale licensed-source placeholder |
| Address/parcel/building/admin search | Typed fixture search adapter                                 |
| EPSG:3794 normalization              | Live utility with a representative unit test                 |
| Basemap                              | Runtime-configured provider or local tile-free style         |
| GURS/ETN/listing network calls       | Not connected                                                |

## Replacing fixtures with PostGIS and vector tiles

A future ingestion service can load licensed source snapshots into PostGIS, retain source/version fields, and precompute normalized WGS84 geometry. The existing repository interfaces can then be implemented with SQL for detail/search queries.

At national scale, parcel and building visualization should move from GeoJSON BFF responses to generated vector tiles (for example, Martin, Tegola, or a managed tile service) keyed by source version. MapLibre source definitions would switch from `geojson` to `vector`, while layer IDs, selection events, filters, URL state, detail endpoints, and Vue panels remain unchanged. Feature IDs must stay stable so selection and detail lookup continue to work.

Transaction/listing clusters can remain server-filtered vector tiles or bounded GeoJSON depending on density. The BFF should continue to enforce result limits, cache policy, authorization, attribution, and private-token handling.

## Privacy gate

Ownership or physical-person information is intentionally absent. Any future ownership feature requires an explicit legal basis, privacy impact review, access-control design, retention policy, and abuse assessment before an adapter or UI is created.

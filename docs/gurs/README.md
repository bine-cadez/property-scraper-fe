# GURS data sources for the property map

Research verified on 2026-07-30 against the production GURS services.

## What to use

Use three different access patterns:

1. **Live cadastral lookup:** GURS Kataster nepremičnin (KN) WFS or OGC API
   Features for parcel, building, building-part, address, and land-use records.
2. **Live official valuation lookup:** GURS Evidenca vrednotenja (EV) WFS,
   joined to KN by the stable `EID_*` identifiers.
3. **Imported completed transactions:** Evidenca trga nepremičnin (ETN) CSV
   archives from JGP. Import these into the application database; there is no
   verified public ETN WFS endpoint at the analogous
   `wfs-si-gurs-etn` address.

Do not scrape the HTML or network internals of Javni vpogled. The public viewer
is useful for manual verification, but the services and downloads below are the
supported data boundary.

## Files saved in this repository

### Official documentation

| File                                                              | Why it is needed                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `reference/Preberi_me.docx`                                       | GURS reuse, attribution, coordinate, and data-validity guidance                    |
| `reference/GU_DO2_SIST_TD_dostopDo_podatkov_servisi_in_baza.docx` | WFS, OGC API Features, REST, pagination, filtering, formats, and change-feed guide |
| `reference/GU_DO2_SIST_TD_WFS_opisi.pdf`                          | Detailed WFS layer and field descriptions                                          |
| `reference/Struktura_KN_lastniki_PO_JGP.xlsx`                     | Bulk cadastral CSV/SHP structure                                                   |
| `reference/Struktura_naslovi_HS.xlsx`                             | House-number and address structure                                                 |
| `reference/Opis_strukture_ETN4_V15.1.docx`                        | ETN transaction CSV structure and code lists                                       |
| `reference/EV_opis_strukture_JGP_dec2025.docx`                    | Official mass-valuation download structure                                         |

### Machine-readable service definitions

| File                                | Contents                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `schemas/kn-wfs-capabilities.xml`   | Current KN WFS layer catalogue and limits                                         |
| `schemas/kn-core-layers.xsd`        | Schema for parcels, buildings, footprints, building parts, and building addresses |
| `schemas/ev-wfs-capabilities.xml`   | Current EV WFS layer catalogue                                                    |
| `schemas/ev-core-layers.xsd`        | Schema for parcel/building/unit valuation joins                                   |
| `schemas/kn-wms-capabilities.xml`   | Cadastral display layers                                                          |
| `schemas/dts-wmts-capabilities.xml` | Orthophoto, base map, lidar, and topographic tile layers                          |

### Verified samples

| File                                        | Contents                                                         |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `samples/parcel-1727-324.geojson`           | Parcel from the supplied screenshot, returned in WGS84           |
| `samples/parcel-1727-324-valuation.geojson` | Its two official parcel valuation units                          |
| `samples/building-1727-2143.geojson`        | The building shown on that parcel                                |
| `samples/ETN_SLO_2025_KPP_20260726.zip`     | Complete public 2025 sales archive used to verify the ETN format |

The samples are source data, not test expectations that should remain fixed
forever. GURS can correct records and republish archives.

## Verified service endpoints

### Cadastral vector and attribute data

- WFS:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-kn/wfs`
- OGC API landing page:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-kn/ogc/features/`
- OGC API collection catalogue:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-kn/ogc/features/collections/`
- Extended collection/field descriptions:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-kn/ogc/features/collectionsExt/`

The WFS `CountDefault` was 20,000 when checked. Do not treat that as a promise
that a broad national query will work. Use small bounding boxes, explicit
filters, selected properties, pagination, and caching.

Core KN collections:

- `PARCELE`: parcel geometry and primary facts
- `STAVBE`: building facts, centroid, and several footprint geometries
- `STAVBE_OBRIS`: simplified building outlines
- `DELI_STAVB`: building units/parts
- `STAVBE_PARCELE`: parcel-to-building relation
- `NASLOVI_STAVBE`: building address relation
- `PARCELE_X_DEJANSKE_RABE`: actual land use
- `PARCELE_X_NAMENSKE_RABE`: intended/planned land use
- `PARCELE_X_BONITETE`: land-quality relation
- `PARCELE_X_POSEBNI_REZIMI`: special-regime relation
- `UREJENE_MEJE`: formally regulated boundaries

The service also exposes `_H` history/change layers. Use those for incremental
ETL only after implementing durable checkpoints around `DATUM_SYS`; they are
not the first choice for an interactive map request.

### Official mass valuations

- WFS:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-ev/wfs`
- Capabilities:
  `https://ipi.eprostor.gov.si/wfs-si-gurs-ev/wfs?service=WFS&request=GetCapabilities`

Core EV layers:

- `PARCELA`: parcel identity and facts
- `PARC_ENOTA`: parcel valuation units and `POSPLOSENA_VREDNOST`
- `STAVBA`: building facts used by valuation
- `DEL_STAVBE`: building-part facts
- `DEL_STAVBE_ENOTA`: building-part valuation and
  `POSPLOSENA_VREDNOST`
- `PE`: special/additional valuation-unit relations

Do not call the EV value an estimated sale price. It is a
**posplošena vrednost** produced by the official mass-valuation system.

### Address search

Verified public endpoint:

`https://ipi.eprostor.gov.si/search-api/v1/external/iskanje/naslovi/`

Example parameters:

- `vir=Naslovi stavb`
- `filter=Poljanska cesta 15 Ljubljana`

The response contains GURS building and house-number identifiers plus `E` and
`N` coordinates in SI-D96/TM. Use the IDs to fetch authoritative KN records.
Do not treat the search response itself as the final property record.

### Cadastral display and orthophoto

- KN WMS:
  `https://ipi.eprostor.gov.si/wms-si-gurs-kn/wms`
- GURS DTS WMTS:
  `https://ipi.eprostor.gov.si/gwc-si-gurs-dts/service/wmts`

Useful layers include:

- `SI.GURS.KN:PARCELE`
- `SI.GURS.KN:STAVBE_OBRIS`
- `SI.GURS.ZPDZ:DOF050`
- `SI.GURS.ZPDZ:DOF025`
- `SI.GURS.ZPDZ:DOF050_Z` for historical orthophoto years
- `SI.GURS.ZPDZ:LIDAR`
- `SI.GURS.DK:OSK`

Most GURS WMTS matrix sets are EPSG:3794-specific. `DOF025` also advertised an
EPSG:4326 matrix set when checked. MapLibre normally uses Web Mercator, so do
not assume these WMTS URLs can be dropped into a MapLibre raster source.
Either use a compatible WMS request, reproject/retile server-side, or use a
map client/source implementation that supports the advertised matrix set.

## Example: fetch one parcel as MapLibre-ready GeoJSON

The following OGC API request was verified against the parcel in the supplied
screenshot:

```bash
curl --get \
  'https://ipi.eprostor.gov.si/wfs-si-gurs-kn/ogc/features/collections/PARCELE/items' \
  --data-urlencode 'limit=1' \
  --data-urlencode "filter=KO_ID=1727 AND ST_PARCELE='324'" \
  --data-urlencode 'filter-lang=cql-text' \
  --data-urlencode 'crs=EPSG:4326' \
  --data-urlencode 'f=application/geo+json'
```

It returned:

- cadastral municipality: `1727 POLJANSKO PREDMESTJE`
- parcel: `324`
- area: `518 m²`
- `EID_PARCELA`: `100100000278010399`
- administrative status: `ni urejena`
- polygon geometry in longitude/latitude

The stable EID is the important join key. Human-facing parcel or building
numbers are only unique together with the cadastral municipality.

## Verified join flow

For a selected parcel:

1. Query KN `PARCELE` using a bounding box, feature ID, or
   `KO_ID + ST_PARCELE`.
2. Store `EID_PARCELA`.
3. Query KN relation layers for buildings, land uses, boniteta, restrictions,
   and administrative areas.
4. Query EV `PARC_ENOTA` with `EID_PARCELA`.
5. Sum or present the valuation units carefully. Keep the model ID and share
   of parcel area visible.
6. Find nearby ETN transactions in the local database using geometry,
   property type, dates, and comparable attributes.

For a selected building/unit:

1. Query KN `STAVBE` or `DELI_STAVB`.
2. Store `EID_STAVBA` and `EID_DEL_STAVBE`.
3. Query EV `STAVBA`, `DEL_STAVBE`, and `DEL_STAVBE_ENOTA`.
4. Use nearby ETN records as comparables, not as a replacement for the
   selected property's official valuation.

The screenshot parcel returned two EV parcel units:

- `STZ` / `STAVBNA ZEMLJIŠČA`: 63.7066% and EUR 316,800
- `ZPS` / `ZEMLJIŠČE POD STAVBAMI`: 36.2934% and EUR 0

This is why a single `parcel.value` field is too lossy for the ingestion
model.

## ETN completed sales and rents

JGP catalogue API:

`https://ipi.eprostor.gov.si/jgp-service-api`

Relevant product IDs:

| Data                        | Group | Display product | Coverage/filter               | Format      |
| --------------------------- | ----: | --------------: | ----------------------------- | ----------- |
| National completed sales    |   127 |             321 | `DRZAVA=1`, years 2007 onward | ZIP/CSV     |
| National rents              |   127 |             322 | `DRZAVA=1`, years 2013 onward | ZIP/CSV     |
| Municipal completed sales   |   131 |             323 | `OBCINE=<id>`, by year        | ZIP/CSV     |
| Municipal rents             |   131 |             324 | `OBCINE=<id>`, by year        | ZIP/CSV     |
| National parcels            |   122 |              25 | `DRZAVA=1`                    | ZIP/SHP+CSV |
| National buildings          |   121 |              14 | `DRZAVA=1`                    | ZIP/SHP+CSV |
| Municipal parcels           |   129 |               7 | `OBCINE=<id>`                 | ZIP/SHP+CSV |
| Municipal buildings         |   129 |               6 | `OBCINE=<id>`                 | ZIP/SHP+CSV |
| National valuation archive  |   361 |             361 | `DRZAVA=1`                    | ZIP/CSV     |
| Municipal valuation archive |   363 |             362 | `OBCINE=<id>`                 | ZIP/CSV     |

The `/result` endpoint returns the current filename and size. The `/file`
endpoint returns a short-lived, tokenized download URL. Resolve it immediately;
never commit or cache its token.

Example metadata request:

```text
GET /display-views/groups/127/composite-products/321/result
    ?filterParam=DRZAVA
    &filterValue=1
    &filterYear=2025
```

The 2025 sales archive contained:

- `KPP_POSLI.csv`: one legal transaction/deal row
- `KPP_DELISTAVB.csv`: building parts participating in deals
- `KPP_ZEMLJISCA.csv`: parcels/land participating in deals
- `sifranti.csv`: code-list values

Join the CSV files on `ID_POSLA`.

Important fields:

- Deal price: `POGODBENA_CENA_ODSKODNINA`
- Deal dates: `DATUM_SKLENITVE_POGODBE`, `DATUM_UVELJAVITVE`
- Marketability/status: `TRZNOST_POSLA`
- Component prices, when supplied:
  `POGODBENA_CENA_DELA_STAVBE` or `POGODBENA_CENA_PARCELE`
- Location: `E_CENTROID`, `N_CENTROID` in EPSG:3794
- Building-part facts: area, usable area, rooms, year, floor, and actual use
- Land facts: cadastral municipality, parcel number, land type, area, and
  sold share

A deal may contain multiple parcels and/or building parts. Never duplicate the
deal-level price onto every component. Preserve a normalized `deal` table and
component tables, then calculate comparable prices only when the allocation is
defensible.

## Bulk-file sizes and recommended ingestion

Sizes observed on 2026-07-30:

- 2025 national sales: about 3.2 MB compressed
- national buildings: about 692 MB compressed
- national parcel archive: about 1.54 GB compressed
- national valuation archive: about 1.11 GB compressed

Do not put the three national cadastral/valuation archives in the Nuxt
repository. For an MVP, use live filtered KN/EV requests and import one or more
ETN years. For national production search and rendering, ingest bulk archives
into PostGIS/object storage and publish cached API responses or vector tiles.

## Coordinate handling

GURS source coordinates are normally SI-D96/TM, EPSG:3794.

- Prefer requesting EPSG:4326/CRS84 from WFS or OGC API when returning GeoJSON
  directly to MapLibre.
- Keep original EPSG:3794 coordinates in ingestion tables for traceability.
- Transform ETN CSV centroids to EPSG:4326 or EPSG:3857 during ETL.
- GeoJSON coordinate order is longitude, latitude.
- Do coordinate conversion server-side and test it with known points.

## Licence and attribution

The cadastral OPSI record explicitly lists CC BY 4.0. The GURS public-access
terms state that GURS geodetic data may be reused commercially and
non-commercially under CC BY 4.0 with attribution.

The required attribution should identify:

`Geodetska uprava Republike Slovenije, <data type>, <data state/date>`

The ETN OPSI record currently leaves its standalone licence field blank but
links to the same GURS general terms. Before a commercial launch or
redistribution of transformed ETN data, record the applicable terms and have
the attribution/privacy approach reviewed.

Do not ingest or expose protected natural-person ownership data. The public
services do not grant a right to registered/protected datasets.

## Recommended first implementation

1. Add a Nuxt server endpoint for address search.
2. Add a server endpoint that accepts a tightly bounded map viewport and
   proxies selected KN collections as WGS84 GeoJSON.
3. Add parcel/building detail endpoints keyed by GURS EIDs.
4. Add an EV repository for official valuation units.
5. Import 2025 and current-year ETN sales into Postgres/PostGIS.
6. Display official value, completed transaction price, estimated value, and
   asking price as separate concepts.
7. Add caching, request cancellation, source dates, attribution, and
   availability/error handling before expanding nationally.

## Official source pages

- Public services and terms:
  https://www.e-prostor.gov.si/dostopi/javni-dostop/
- Cadastral dataset metadata:
  https://podatki.gov.si/dataset/kataster-nepremicnin
- ETN dataset metadata:
  https://podatki.gov.si/dataset/evidenca-trga-nepremicnin
- JGP bulk-download application:
  https://ipi.eprostor.gov.si/jgp/

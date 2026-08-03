import type { H3Event } from "h3";
import type {
  Building,
  DataSource,
  MoneyValue,
  Parcel,
  PolygonGeometry,
  Position,
  PropertyRecord,
  PropertyUnit,
  SearchResult,
  Transaction,
} from "../../shared/types/property";
import {
  gursDetail,
  gursList,
  gursOperations,
  gursValuationUnits,
} from "../utils/gurs-api";

type Raw = Record<string, unknown>;

const EMPTY_POSITION: Position = [14.9955, 46.1512];

function object(value: unknown): Raw {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

function record(value: unknown): Raw {
  const raw = object(value);
  for (const key of ["data", "item", "record", "result"]) {
    const nested = object(raw[key]);
    if (Object.keys(nested).length) return nested;
  }
  return raw;
}

function records(value: unknown): Raw[] {
  if (Array.isArray(value)) return value.map(object);
  const raw = object(value);
  for (const key of ["data", "items", "records", "results", "values"]) {
    if (Array.isArray(raw[key])) return (raw[key] as unknown[]).map(object);
  }
  return [];
}

function pick(raw: Raw, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
}

function text(raw: Raw, ...keys: string[]): string {
  const value = pick(raw, ...keys);
  return value === undefined ? "" : String(value);
}

function number(raw: Raw, ...keys: string[]): number | undefined {
  const value = Number(pick(raw, ...keys));
  return Number.isFinite(value) ? value : undefined;
}

function id(raw: Raw): string {
  return text(
    raw,
    "id",
    "recordId",
    "record_id",
    "gursId",
    "gurs_id",
    "eidParcela",
    "eidStavba",
  );
}

function geometryCenter(coordinates: unknown): Position | undefined {
  const positions: Position[] = [];

  function visit(value: unknown) {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      Number.isFinite(Number(value[0])) &&
      Number.isFinite(Number(value[1]))
    ) {
      positions.push([Number(value[0]), Number(value[1])]);
      return;
    }
    for (const nested of value) visit(nested);
  }

  visit(coordinates);
  if (!positions.length) return undefined;
  const lngs = positions.map(([lng]) => lng);
  const lats = positions.map(([, lat]) => lat);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

function position(raw: Raw): Position {
  const geometry = object(pick(raw, "geometry", "geom", "location"));
  const coordinates = pick(geometry, "coordinates") ?? pick(raw, "coordinates");
  if (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1]))
  ) {
    return [Number(coordinates[0]), Number(coordinates[1])];
  }
  const center = geometryCenter(coordinates);
  if (center) return center;
  const longitude = number(raw, "longitude", "lng", "lon", "x_wgs84");
  const latitude = number(raw, "latitude", "lat", "y_wgs84");
  return longitude !== undefined && latitude !== undefined
    ? [longitude, latitude]
    : EMPTY_POSITION;
}

function polygon(raw: Raw, center: Position): PolygonGeometry {
  const geometry = object(pick(raw, "geometry", "geom"));
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates)) {
    return geometry as unknown as PolygonGeometry;
  }
  const [lng, lat] = center;
  const d = 0.00004;
  return {
    type: "Polygon",
    coordinates: [
      [
        [lng - d, lat - d],
        [lng + d, lat - d],
        [lng + d, lat + d],
        [lng - d, lat + d],
        [lng - d, lat - d],
      ],
    ],
  };
}

function date(raw: Raw): string {
  return (
    text(
      raw,
      "referenceDate",
      "reference_date",
      "updatedAt",
      "updated_at",
      "retrievedAt",
      "retrieved_at",
    ) || new Date().toISOString().slice(0, 10)
  );
}

function source(raw: Raw = {}): DataSource {
  const url = text(raw, "sourceUrl", "source_url", "url");
  return {
    id: text(raw, "sourceId", "source_id", "dataset") || "gurs",
    name: text(raw, "sourceName", "source_name") || "GURS – uradni podatki",
    ...(url ? { url } : {}),
    license: "Vir: Geodetska uprava Republike Slovenije.",
    quality: "current",
  };
}

function money(raw: Raw, area?: number): MoneyValue | undefined {
  const amount = number(
    raw,
    "modelledValue",
    "modelled_value",
    "value",
    "amount",
    "officialValue",
    "official_value",
  );
  if (amount === undefined) return undefined;
  return {
    amount,
    ...(area && area > 0 ? { amountPerM2: amount / area } : {}),
    valueType: "official_assessed",
    source: source(raw),
    sourceUpdatedAt: date(raw),
  };
}

function unwrapValuation(value: unknown): Raw | undefined {
  return (
    records(value)[0] ??
    (Object.keys(record(value)).length ? record(value) : undefined)
  );
}

function cadastral(raw: Raw) {
  const nested = object(
    pick(raw, "cadastralMunicipality", "cadastral_municipality"),
  );
  return {
    id:
      text(
        raw,
        "cadastralMunicipalityId",
        "cadastral_municipality_id",
        "cadastralMunicipalityCode",
        "koId",
        "ko_id",
      ) || id(nested),
    name:
      text(
        raw,
        "cadastralMunicipalityName",
        "cadastral_municipality_name",
        "koName",
        "ko_name",
      ) || text(nested, "name", "label"),
  };
}

function asParcel(raw: Raw, valuation?: Raw): Parcel {
  const center = position(raw);
  const municipality = cadastral(raw);
  const parcelId = id(raw) || text(raw, "parcelId", "parcel_id") || "unknown";
  const area = number(raw, "area", "areaM2", "area_m2", "surface") ?? 0;
  const officialValue = valuation ? money(valuation, area) : money(raw, area);
  return {
    id: parcelId,
    cadastralMunicipalityId: municipality.id || "—",
    cadastralMunicipalityName: municipality.name || "Ni podatka",
    parcelNumber:
      text(raw, "parcelNumber", "parcel_number", "number", "parcelNo") ||
      parcelId,
    geometry: polygon(raw, center),
    centroid: center,
    areaM2: area,
    landUse:
      text(raw, "landUse", "land_use", "actualUse", "actual_use") ||
      "Ni podatka",
    intendedUse: text(raw, "intendedUse", "intended_use") || "Ni podatka",
    regulationStatus:
      text(raw, "administrativeStatus", "administrative_status", "status") ||
      "Ni podatka",
    buildingIds: records(pick(raw, "buildings")).map(id).filter(Boolean),
    ...(officialValue ? { officialValue } : {}),
    dataSource: source(raw),
    sourceUpdatedAt: date(raw),
  };
}

function address(raw: Raw): string {
  const nested = object(
    pick(raw, "address", "primaryAddress", "primary_address"),
  );
  if (typeof raw.address === "string") return raw.address;
  return (
    text(raw, "fullAddress", "full_address", "addressLabel", "address_label") ||
    text(nested, "fullAddress", "full_address", "label") ||
    [
      text(raw, "street", "streetName", "street_name") ||
        text(nested, "street"),
      text(raw, "houseNumber", "house_number") || text(nested, "houseNumber"),
      text(raw, "postalCode", "postal_code") || text(nested, "postalCode"),
      text(raw, "settlement") || text(nested, "settlement"),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function asBuilding(raw: Raw, valuation?: Raw): Building {
  const center = position(raw);
  const area =
    number(raw, "grossFloorArea", "gross_floor_area", "grossAreaM2", "area") ??
    0;
  const buildingId =
    id(raw) || text(raw, "buildingId", "building_id") || "unknown";
  const officialValue = valuation ? money(valuation, area) : money(raw, area);
  const constructionYear = number(
    raw,
    "constructionYear",
    "construction_year",
    "yearBuilt",
  );
  const renovationYear = number(raw, "renovationYear", "renovation_year");
  const energyRating = text(raw, "energyRating", "energy_rating");
  return {
    id: buildingId,
    parcelIds: records(pick(raw, "parcels")).map(id).filter(Boolean),
    address: address(raw) || `Stavba ${buildingId}`,
    geometry: polygon(raw, center),
    footprintAreaM2:
      number(raw, "footprintArea", "footprint_area", "footprintAreaM2") ?? 0,
    grossAreaM2: area,
    ...(constructionYear !== undefined ? { constructionYear } : {}),
    ...(renovationYear !== undefined ? { renovationYear } : {}),
    floors: number(raw, "numberOfFloors", "number_of_floors", "floors") ?? 0,
    unitCount:
      number(raw, "buildingPartCount", "building_part_count", "unitCount") ??
      records(pick(raw, "buildingParts", "building_parts")).length,
    buildingUse:
      text(
        raw,
        "buildingType",
        "building_type",
        "actualUse",
        "actual_use",
        "use",
      ) || "Ni podatka",
    ...(energyRating ? { energyRating } : {}),
    ...(officialValue ? { officialValue } : {}),
    dataSource: source(raw),
    sourceUpdatedAt: date(raw),
  };
}

function propertyType(raw: Raw): PropertyUnit["type"] {
  const value = text(
    raw,
    "actualUse",
    "actual_use",
    "use",
    "type",
  ).toLowerCase();
  if (
    value.includes("stanov") ||
    value.includes("flat") ||
    value.includes("apartment")
  )
    return "apartment";
  if (value.includes("hiš") || value.includes("house")) return "house";
  if (value.includes("pisar") || value.includes("office")) return "office";
  if (
    value.includes("trgov") ||
    value.includes("shop") ||
    value.includes("retail")
  )
    return "retail";
  return "other";
}

function asUnit(raw: Raw, buildingId: string, valuation?: Raw): PropertyUnit {
  const area =
    number(
      raw,
      "usefulArea",
      "useful_area",
      "usableArea",
      "usable_area",
      "area",
    ) ?? 0;
  const officialValue = valuation ? money(valuation, area) : money(raw, area);
  const floor = number(raw, "floor", "floorNumber", "floor_number");
  const rooms = number(raw, "rooms", "numberOfRooms", "number_of_rooms");
  return {
    id:
      id(raw) || text(raw, "buildingPartId", "building_part_id") || buildingId,
    buildingId,
    type: propertyType(raw),
    ...(floor !== undefined ? { floor } : {}),
    usableAreaM2: area,
    ...(rooms !== undefined ? { rooms } : {}),
    ...(officialValue ? { officialValue } : {}),
  };
}

function asTransaction(raw: Raw, fallback: Position): Transaction | undefined {
  const amount = number(raw, "totalPrice", "total_price", "price", "amount");
  if (amount === undefined) return undefined;
  const area = number(raw, "area", "areaM2", "area_m2", "soldArea") ?? 0;
  const item =
    records(pick(raw, "buildingParts", "building_parts", "items"))[0] ?? raw;
  return {
    id: id(raw) || text(raw, "transactionId", "transaction_id"),
    propertyType: propertyType(item),
    location: position(raw)[0] === EMPTY_POSITION[0] ? fallback : position(raw),
    transactionDate:
      text(raw, "contractDate", "contract_date", "transactionDate", "date") ||
      date(raw),
    price: {
      amount,
      ...(area > 0 ? { amountPerM2: amount / area } : {}),
      valueType: "transaction",
      source: source(raw),
      sourceUpdatedAt: date(raw),
    },
    pricePerM2: area > 0 ? amount / area : 0,
    areaM2: area,
    dataSource: source(raw),
    sourceUpdatedAt: date(raw),
  };
}

async function optional<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    return undefined;
  }
}

function selection(value: string) {
  const separator = value.indexOf(":");
  if (separator > 0) {
    return { kind: value.slice(0, separator), id: value.slice(separator + 1) };
  }
  if (value.startsWith("parcela-")) return { kind: "parcel", id: value };
  if (value.startsWith("stavba-")) return { kind: "building", id: value };
  if (value.startsWith("enota-")) return { kind: "building-part", id: value };
  return { kind: "building", id: value };
}

function relationId(raw: Raw, ...keys: string[]) {
  const value = pick(raw, ...keys);
  return typeof value === "object"
    ? id(object(value))
    : value
      ? String(value)
      : "";
}

export async function findProperty(
  event: H3Event,
  selectionValue: string,
): Promise<PropertyRecord> {
  const selected = selection(selectionValue);
  let buildingRaw: Raw = {};
  let partRaw: Raw = {};
  let parcelRaw: Raw = {};

  if (selected.kind === "building-part") {
    partRaw = record(await gursDetail(event, "building-parts", selected.id));
    const buildingId = relationId(
      partRaw,
      "buildingId",
      "building_id",
      "building",
    );
    if (buildingId)
      buildingRaw = record(await gursDetail(event, "buildings", buildingId));
  } else if (selected.kind === "parcel") {
    parcelRaw = record(await gursDetail(event, "parcels", selected.id));
    const embeddedBuilding = records(pick(parcelRaw, "buildings"))[0];
    const buildingId = embeddedBuilding
      ? id(embeddedBuilding)
      : relationId(parcelRaw, "buildingId", "building_id");
    if (buildingId)
      buildingRaw = record(
        (await optional(gursDetail(event, "buildings", buildingId))) ?? {},
      );
  } else if (selected.kind === "address") {
    const addressRaw = record(
      await gursDetail(event, "addresses", selected.id),
    );
    const buildingId = relationId(
      addressRaw,
      "buildingId",
      "building_id",
      "building",
    );
    if (buildingId)
      buildingRaw = record(await gursDetail(event, "buildings", buildingId));
  } else if (selected.kind === "transaction") {
    const transactionRaw = record(
      await gursDetail(event, "transactions", selected.id),
    );
    partRaw =
      records(
        pick(
          transactionRaw,
          "buildingParts",
          "building_parts",
          "soldBuildingParts",
        ),
      )[0] ?? {};
    parcelRaw =
      records(pick(transactionRaw, "parcels", "soldParcels"))[0] ?? {};
    const buildingId = relationId(
      partRaw,
      "buildingId",
      "building_id",
      "building",
    );
    if (buildingId)
      buildingRaw = record(
        (await optional(gursDetail(event, "buildings", buildingId))) ?? {},
      );
  } else {
    buildingRaw = record(await gursDetail(event, "buildings", selected.id));
  }

  const buildingId = id(buildingRaw);
  if (!Object.keys(partRaw).length) {
    partRaw =
      records(pick(buildingRaw, "buildingParts", "building_parts"))[0] ?? {};
  }
  if (!Object.keys(parcelRaw).length) {
    parcelRaw = records(pick(buildingRaw, "parcels"))[0] ?? {};
    const parcelId =
      relationId(buildingRaw, "parcelId", "parcel_id") || id(parcelRaw);
    if (parcelId && !Object.keys(parcelRaw).length) {
      parcelRaw = record(
        (await optional(gursDetail(event, "parcels", parcelId))) ?? {},
      );
    }
  }

  const partId = id(partRaw);
  const parcelId = id(parcelRaw);
  const [buildingValues, partValues, parcelValues, transactionPayload] =
    await Promise.all([
      buildingId
        ? optional(gursValuationUnits(event, "buildings", buildingId))
        : undefined,
      partId
        ? optional(gursValuationUnits(event, "building-parts", partId))
        : undefined,
      parcelId
        ? optional(gursValuationUnits(event, "parcels", parcelId))
        : undefined,
      optional(
        gursList(event, "transactions", {
          ...(partId ? { buildingPartId: partId } : {}),
          ...(parcelId ? { parcelId } : {}),
          ...(buildingId ? { buildingId } : {}),
          limit: 10,
        }),
      ),
    ]);

  const buildingValue = unwrapValuation(buildingValues);
  const partValue = unwrapValuation(partValues);
  const parcelValue = unwrapValuation(parcelValues);
  const building = Object.keys(buildingRaw).length
    ? asBuilding(buildingRaw, buildingValue)
    : undefined;
  const center = building ? position(buildingRaw) : position(parcelRaw);
  const parcel = asParcel(
    Object.keys(parcelRaw).length
      ? parcelRaw
      : {
          id: `unlinked-${buildingId || selected.id}`,
          parcelNumber: "Ni podatka",
          coordinates: center,
        },
    parcelValue,
  );
  const unit = Object.keys(partRaw).length
    ? asUnit(partRaw, building?.id || buildingId, partValue)
    : undefined;
  const transactions = records(transactionPayload)
    .map((item) => asTransaction(item, center))
    .filter((item): item is Transaction => Boolean(item));
  const municipality = cadastral(
    Object.keys(parcelRaw).length ? parcelRaw : buildingRaw,
  );
  const displayAddress =
    (unit ? address(partRaw) : "") ||
    building?.address ||
    `GURS zapis ${selected.id}`;

  return {
    id: `${selected.kind}:${selected.id}`,
    slug: selected.id,
    title:
      unit?.type === "apartment"
        ? "Del stavbe"
        : building
          ? "Stavba"
          : "Parcela",
    address: displayAddress,
    municipality:
      text(
        buildingRaw,
        "municipality",
        "municipalityName",
        "municipality_name",
      ) ||
      municipality.name ||
      "Slovenija",
    settlement:
      text(buildingRaw, "settlement", "settlementName", "settlement_name") ||
      text(partRaw, "settlement", "settlementName", "settlement_name") ||
      "Slovenija",
    propertyType: unit?.type ?? propertyType(buildingRaw),
    coordinates: center,
    parcel,
    ...(building ? { building } : {}),
    units: unit ? [unit] : [],
    transactions,
    listings: [],
  };
}

function searchType(raw: Raw): SearchResult["type"] {
  const value = text(
    raw,
    "type",
    "kind",
    "resource",
    "entityType",
    "entity_type",
  )
    .toLowerCase()
    .replaceAll("_", "-");
  if (value.includes("cadastral")) return "cadastral_municipality";
  if (value.includes("parcel")) return "parcel";
  if (value.includes("building")) return "building";
  if (value.includes("address")) return "address";
  if (value.includes("settlement")) return "settlement";
  if (value.includes("municipality")) return "municipality";
  return "address";
}

function selectionKind(
  raw: Raw,
  type: SearchResult["type"],
): string | undefined {
  if (type === "parcel") return "parcel";
  if (type === "building") {
    const resource = text(raw, "type", "kind", "resource").toLowerCase();
    return resource.includes("part") ? "building-part" : "building";
  }
  if (type === "address") return "address";
}

export async function searchProperties(
  event: H3Event,
  query: string,
  limit = 8,
): Promise<SearchResult[]> {
  const payload = await gursOperations.search(event, query, limit);
  return records(payload)
    .slice(0, limit)
    .map((raw, index) => {
      const type = searchType(raw);
      const recordId =
        id(raw) || text(raw, "targetId", "target_id") || String(index);
      const kind = selectionKind(raw, type);
      return {
        id: recordId,
        type,
        primaryLabel:
          text(raw, "label", "name", "title", "fullAddress", "full_address") ||
          recordId,
        secondaryLabel:
          text(
            raw,
            "description",
            "subtitle",
            "secondaryLabel",
            "secondary_label",
          ) ||
          (
            {
              address: "Naslov",
              municipality: "Občina",
              settlement: "Naselje",
              cadastral_municipality: "Katastrska občina",
              parcel: "Parcela",
              building: "Stavba",
            } as const
          )[type],
        coordinates: position(raw),
        ...(kind ? { selectionId: `${kind}:${recordId}` } : {}),
      };
    });
}

export async function dataOverview(event: H3Event) {
  const [sources, statistics, health, readiness] = await Promise.all([
    optional(gursList(event, "sources")),
    optional(gursOperations.statistics(event)),
    optional(gursOperations.health(event)),
    optional(gursOperations.ready(event)),
  ]);
  return {
    sources: records(sources),
    statistics: record(statistics),
    health: record(health),
    readiness: record(readiness),
  };
}

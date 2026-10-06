import type { MapResultItem } from "#shared/types/property";
import { BUILDING_VALUE_PROPERTY_KEYS } from "~/utils/map/layers";

export interface BuildingMapFeature {
  id?: string | number | undefined;
  properties?: Record<string, unknown> | null | undefined;
}

function propertyValue(
  properties: Record<string, unknown>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = properties[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
}

function numberProperty(
  properties: Record<string, unknown>,
  keys: readonly string[],
) {
  const value = Number(propertyValue(properties, keys));
  return Number.isFinite(value) ? value : undefined;
}

function stringProperty(
  properties: Record<string, unknown>,
  keys: readonly string[],
) {
  const value = propertyValue(properties, keys);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function buildingResultFromFeature(
  feature: BuildingMapFeature,
): MapResultItem | undefined {
  const properties = feature.properties ?? {};
  const id = String(
    propertyValue(properties, [
      "id",
      "building_id",
      "buildingId",
      "eid_stavba",
    ]) ??
      feature.id ??
      "",
  );
  if (!id) return undefined;

  const address =
    stringProperty(properties, ["full_address", "address", "label"]) ??
    `Stavba ${id}`;
  const item: MapResultItem = {
    id,
    kind: "building",
    selectionId: `building:${id}`,
    address,
  };
  const location = stringProperty(properties, [
    "settlement",
    "city_name",
    "cityName",
    "city",
    "municipality_name",
    "municipalityName",
    "municipality",
  ]);
  const officialValue = numberProperty(
    properties,
    BUILDING_VALUE_PROPERTY_KEYS,
  );
  const areaM2 = numberProperty(properties, [
    "gross_floor_area",
    "grossFloorArea",
    "gross_area_m2",
    "grossAreaM2",
    "usable_area_m2",
    "usableAreaM2",
    "area_m2",
    "areaM2",
    "area",
    "footprint_area_m2",
    "footprintAreaM2",
    "footprint_area",
    "footprintArea",
  ]);
  const footprintAreaM2 = numberProperty(properties, [
    "footprint_area_m2",
    "footprintAreaM2",
    "footprint_area",
    "footprintArea",
  ]);
  const constructionYear = numberProperty(properties, [
    "construction_year",
    "constructionYear",
    "year_built",
    "yearBuilt",
  ]);
  const unitCount = numberProperty(properties, [
    "building_part_count",
    "buildingPartCount",
    "unit_count",
    "unitCount",
  ]);
  const floors = numberProperty(properties, [
    "number_of_floors",
    "numberOfFloors",
    "floors",
  ]);
  const buildingUse = stringProperty(properties, [
    "building_type",
    "buildingType",
    "actual_use",
    "actualUse",
    "use",
  ]);

  if (location) item.location = location;
  if (officialValue !== undefined) item.officialValue = officialValue;
  if (areaM2 !== undefined) item.areaM2 = areaM2;
  if (footprintAreaM2 !== undefined) item.footprintAreaM2 = footprintAreaM2;
  if (constructionYear !== undefined) item.constructionYear = constructionYear;
  if (unitCount !== undefined) item.unitCount = unitCount;
  if (floors !== undefined) item.floors = floors;
  if (buildingUse) item.buildingUse = buildingUse;

  return item;
}

export function visibleBuildingResults(
  features: BuildingMapFeature[],
): MapResultItem[] {
  const byId = new Map<string, MapResultItem>();
  for (const feature of features) {
    const item = buildingResultFromFeature(feature);
    if (item && !byId.has(item.id)) byId.set(item.id, item);
  }

  return [...byId.values()]
    .sort((a, b) => a.address.localeCompare(b.address, "sl", { numeric: true }))
    .slice(0, 50);
}

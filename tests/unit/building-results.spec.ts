import { describe, expect, it } from "vitest";
import {
  buildingResultFromFeature,
  visibleBuildingResults,
} from "../../app/utils/map/building-results";

describe("visible building results", () => {
  it("projects building marker properties into a sidebar record", () => {
    expect(
      buildingResultFromFeature({
        id: 42,
        properties: {
          full_address: "Frankopanska ulica 8",
          settlement: "Ljubljana",
          combined_modelled_value: 1_300_000,
          gross_floor_area: 460,
          footprint_area: 180,
          construction_year: 1998,
          building_part_count: 12,
          number_of_floors: 4,
          building_type: "Večstanovanjska stavba",
        },
      }),
    ).toMatchObject({
      id: "42",
      kind: "building",
      selectionId: "building:42",
      address: "Frankopanska ulica 8",
      location: "Ljubljana",
      officialValue: 1_300_000,
      areaM2: 460,
      footprintAreaM2: 180,
      constructionYear: 1998,
      unitCount: 12,
      floors: 4,
      buildingUse: "Večstanovanjska stavba",
    });
  });

  it("deduplicates tile-edge copies and sorts visible buildings by address", () => {
    const results = visibleBuildingResults([
      { id: "2", properties: { full_address: "Celovška cesta 10" } },
      { id: "1", properties: { full_address: "Celovška cesta 2" } },
      { id: "1", properties: { full_address: "Celovška cesta 2" } },
    ]);

    expect(results.map(({ id }) => id)).toEqual(["1", "2"]);
  });
});

import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it } from "vitest";
import MapResultsPanel from "../../app/components/MapResultsPanel.vue";

describe("building map results panel", () => {
  it("renders visible buildings as the primary sidebar content", async () => {
    const wrapper = await mountSuspended(MapResultsPanel, {
      props: {
        results: [
          {
            id: "building-1",
            kind: "building",
            selectionId: "building:building-1",
            address: "Frankopanska ulica 8",
            location: "Ljubljana",
            officialValue: 1_300_000,
            areaM2: 460,
            constructionYear: 1998,
            unitCount: 12,
          },
        ],
        featureCount: 1,
        buildingsVisible: true,
        selectedId: undefined,
        comparisonIds: [],
      },
    });

    expect(wrapper.text()).toContain("Stavbe · Ljubljana");
    expect(wrapper.text()).toContain("Frankopanska ulica 8");
    expect(wrapper.text()).toContain("1.300.000");
    expect(wrapper.text()).toContain("460 m²");
    expect(wrapper.text()).not.toContain("Prodaje na zemljevidu");

    await wrapper.get("article button").trigger("click");
    expect(wrapper.emitted("select")?.[0]?.[0]).toMatchObject({
      selectionId: "building:building-1",
    });
  });
});

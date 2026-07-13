import { describe, it, expect } from "vitest";
import { toTrafficItems } from "./traffic";
import type { MapQuestIncident } from "../types";

function incident(over: Partial<MapQuestIncident>): MapQuestIncident {
  return {
    id: "1", type: 1, severity: 2, fullDesc: "desc",
    parameterizedDescription: { roadName: "I-95", crossRoad1: "Exit 1" },
    ...over,
  };
}

describe("toTrafficItems", () => {
  it("keeps short road names intact", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "I-95", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("I-95");
  });
  it("renames Baltimore Washington Pkwy to MD-295", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "Baltimore Washington Pkwy", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("MD-295");
  });
  it("truncates other long names to 5 chars + ellipsis", () => {
    const [item] = toTrafficItems([incident({ parameterizedDescription: { roadName: "Ritchie Highway", crossRoad1: "x" } })]);
    expect(item.displayName).toBe("Ritch...");
  });
  it("carries id, type and severity", () => {
    const [item] = toTrafficItems([incident({ id: "9", type: 4, severity: 3 })]);
    expect(item).toMatchObject({ id: "9", type: 4, severity: 3 });
  });
});

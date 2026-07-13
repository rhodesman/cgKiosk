import type { MapQuestIncident } from "../types";

export interface TrafficItem {
  id: string;
  name: string;
  displayName: string;
  type: number;
  severity: number;
}

function shorten(name: string): string {
  if (name.length <= 7) return name;
  if (name === "Baltimore Washington Pkwy") return "MD-295";
  return `${name.substring(0, 5)}...`;
}

export function toTrafficItems(incidents: MapQuestIncident[]): TrafficItem[] {
  return incidents.map((inc) => {
    const name = inc.parameterizedDescription.roadName;
    return { id: inc.id, name, displayName: shorten(name), type: inc.type, severity: inc.severity };
  });
}

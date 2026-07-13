import { usePolling } from "../hooks/usePolling";
import { fetchTraffic } from "../api/kiosk";
import { toTrafficItems } from "../lib/traffic";
import { ScrollList } from "./ScrollList";
import type { MapQuestIncident } from "../types";

export function TrafficPanel({ onSelectIncident }: { onSelectIncident: (inc: MapQuestIncident) => void }) {
  const { data } = usePolling(fetchTraffic, 60000);
  const incidents = data?.incidents ?? [];
  const items = toTrafficItems(incidents);

  return (
    <section id="traffic" className="col-3">
      <h2>Travel Information</h2>
      <ScrollList>
        {items.length === 0 ? (
          <li className="type-0 severity-0 tally-0"><i /><span>No Traffic!</span></li>
        ) : (
          items.map((item) => {
            const inc = incidents.find((i) => i.id === item.id)!;
            return (
              <li
                key={item.id}
                id={item.id}
                className={`type-${item.type} severity-${item.severity} tally-1`}
                onClick={() => onSelectIncident(inc)}
              >
                <i />
                <span>{item.displayName}</span>
              </li>
            );
          })
        )}
      </ScrollList>
    </section>
  );
}

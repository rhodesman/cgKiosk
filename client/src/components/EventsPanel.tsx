import { usePolling } from "../hooks/usePolling";
import { fetchEvents } from "../api/kiosk";
import { formatEventListDate } from "../lib/eventFormat";
import { ScrollList } from "./ScrollList";
import type { NexudusEvent } from "../types";

export function EventsPanel({ onSelectEvent }: { onSelectEvent: (e: NexudusEvent) => void }) {
  const { data } = usePolling(fetchEvents, 60000);
  const events = data?.CalendarEvents ?? [];

  return (
    <section id="events" className="col">
      <h2>Event Schedule</h2>
      <ScrollList>
        {events.map((e) => {
          const { label, time } = formatEventListDate(e.StartDate);
          return (
            <li key={e.Id} id={String(e.Id)} onClick={() => onSelectEvent(e)}>
              <div className="date">
                <span className="to">{label}</span>
                <span className="from">{time}</span>
              </div>
              <div className="title">{e.Name}</div>
            </li>
          );
        })}
      </ScrollList>
    </section>
  );
}

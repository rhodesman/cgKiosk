import { useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { fetchEvents, fetchSpace } from "../api/kiosk";
import { formatEventListDate } from "../lib/eventFormat";
import { suiteSelector } from "../lib/suites";
import { ScrollList } from "./ScrollList";
import type { NexudusEvent } from "../types";

interface Props {
  onSelectEvent: (e: NexudusEvent) => void;
  onRoomsForToday?: (selectors: string[]) => void;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function EventsPanel({ onSelectEvent, onRoomsForToday }: Props) {
  const { data } = usePolling(fetchEvents, 60000);
  const events = data?.CalendarEvents ?? [];

  useEffect(() => {
    const todays = events.filter((e) => isToday(e.StartDate));
    if (todays.length === 0 || !onRoomsForToday) return;
    let active = true;
    (async () => {
      for (const e of todays) {
        const d = new Date(e.StartDate);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        try {
          const bookings = await fetchSpace(key);
          if (!active) return;
          const selectors = bookings
            .map((b) => b.resourceName)
            .filter((n) => /^\d+$/.test(n))
            .map((n) => suiteSelector(n));
          if (selectors.length > 0) onRoomsForToday(selectors);
        } catch {
          /* ignore a failed space lookup */
        }
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

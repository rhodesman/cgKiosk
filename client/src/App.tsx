import { useCallback, useState } from "react";
import { WelcomePanel } from "./components/WelcomePanel";
import { WeatherPanel } from "./components/WeatherPanel";
import { TrafficPanel } from "./components/TrafficPanel";
import { EventsPanel } from "./components/EventsPanel";
import { FloorMap } from "./components/FloorMap";
import { DirectoryPanel } from "./components/DirectoryPanel";
import { AlertModal, type Alert } from "./components/AlertModal";
import { suiteSelector } from "./lib/suites";
import type { MapQuestIncident, NexudusEvent } from "./types";

const HIGHLIGHT_MS = 5000;

export function App() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [highlighted, setHighlighted] = useState<string[]>([]);

  const highlightSuite = useCallback((id: string) => {
    const selector = suiteSelector(id);
    setHighlighted([selector]);
    setTimeout(() => setHighlighted((cur) => cur.filter((s) => s !== selector)), HIGHLIGHT_MS);
  }, []);

  const onSelectIncident = (inc: MapQuestIncident) => setAlert({ kind: "traffic", data: inc });
  const onSelectEvent = (e: NexudusEvent) => setAlert({ kind: "event", data: e });

  return (
    <div className="container-fluid">
      <header className="row no-gutters">
        <WelcomePanel />
        <WeatherPanel />
        <TrafficPanel onSelectIncident={onSelectIncident} />
      </header>
      <div className="row main-body">
        <EventsPanel onSelectEvent={onSelectEvent} onRoomsForToday={(selectors) => setHighlighted(selectors)} />
        <FloorMap highlighted={highlighted} />
        <DirectoryPanel onSelectSuite={highlightSuite} />
      </div>
      <AlertModal alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

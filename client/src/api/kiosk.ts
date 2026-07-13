import type {
  NexudusEventsResponse,
  OwmForecastResponse,
  MapQuestTrafficResponse,
  SpaceBooking,
} from "../types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
  return (await res.json()) as T;
}

export const fetchEvents = () => getJson<NexudusEventsResponse>("/api/events");
export const fetchWeather = () => getJson<OwmForecastResponse>("/api/weather");
export const fetchTraffic = () => getJson<MapQuestTrafficResponse>("/api/traffic");
export const fetchSpace = (date: string) => getJson<SpaceBooking[]>(`/api/space/${date}`);

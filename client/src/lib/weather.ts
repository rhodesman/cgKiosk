import type { OwmForecastResponse, OwmForecastEntry } from "../types";

export interface DayWeather {
  temp: number;
  precipClass: string;
}
export interface WeatherSummary {
  today: DayWeather;
  tomorrow: DayWeather;
  weekend: DayWeather;
}

function summarizeBucket(entries: OwmForecastEntry[]): DayWeather {
  if (entries.length === 0) return { temp: 0, precipClass: "" };
  const sum = entries.reduce((acc, e) => acc + e.main.temp, 0);
  const temp = Math.round(sum / entries.length);

  let snow: number | undefined;
  let rain: number | undefined;
  let last = entries[entries.length - 1].weather[0].id;
  for (const e of entries) {
    const id = e.weather[0].id;
    if (id >= 600 && id < 700) snow = id;
    if (id >= 500 && id < 600) rain = id;
    last = id;
  }
  const precip = snow ?? rain ?? last;
  return { temp, precipClass: `precip-${precip}` };
}

export function summarizeForecast(res: OwmForecastResponse, now: Date): WeatherSummary {
  const todayDate = now.getDate();
  const buckets = { today: [] as OwmForecastEntry[], tomorrow: [] as OwmForecastEntry[], weekend: [] as OwmForecastEntry[] };

  for (const e of res.list) {
    const when = new Date(e.dt * 1000);
    if (when.getDate() === todayDate) buckets.today.push(e);
    if (when.getDate() === todayDate + 1) buckets.tomorrow.push(e);
    const day = when.getDay();
    if ((day === 6 || day === 0) && when.getDate() !== todayDate) buckets.weekend.push(e);
  }

  return {
    today: summarizeBucket(buckets.today),
    tomorrow: summarizeBucket(buckets.tomorrow),
    weekend: summarizeBucket(buckets.weekend),
  };
}

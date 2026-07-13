import { usePolling } from "../hooks/usePolling";
import { fetchWeather } from "../api/kiosk";
import { summarizeForecast, type DayWeather } from "../lib/weather";

function Tile({ label, day }: { label: string; day: DayWeather }) {
  return (
    <>
      <dt className={label.toLowerCase()}>{label}</dt>
      <dd className={`${label.toLowerCase()} forcast`}>
        <i className={day.precipClass} />
        <span>{day.temp} &deg;F</span>
      </dd>
    </>
  );
}

export function WeatherPanel() {
  const { data } = usePolling(fetchWeather, 60000);
  const summary = data ? summarizeForecast(data, new Date()) : null;

  return (
    <section id="weather" className="offset-md-1 col-3">
      <dl>
        {summary && (
          <>
            <Tile label="Today" day={summary.today} />
            <Tile label="Tomorrow" day={summary.tomorrow} />
            <Tile label="Weekend" day={summary.weekend} />
          </>
        )}
      </dl>
    </section>
  );
}

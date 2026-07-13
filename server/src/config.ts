type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env) {
  return {
    port: Number(env.PORT) || 8089,
    nexudusBase: env.NEXUDUS_BASE ?? "https://betamore.spaces.nexudus.com/en",
    weather: {
      apiKey: env.OPENWEATHER_API_KEY ?? "",
      cityId: env.OPENWEATHER_CITY_ID ?? "4347820",
    },
    traffic: {
      apiKey: env.MAPQUEST_API_KEY ?? "",
      boundingBox: env.MAPQUEST_BOUNDING_BOX ?? "",
      filters: env.MAPQUEST_FILTERS ?? "congestion,incidents,event",
    },
  };
}

export type Config = ReturnType<typeof loadConfig>;
export const config = loadConfig();

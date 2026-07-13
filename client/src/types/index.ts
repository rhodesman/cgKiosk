export interface NexudusEvent {
  Id: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  LongDescription: string | null;
  VenueAddress: string | null;
}

export interface NexudusEventsResponse {
  CalendarEvents: NexudusEvent[];
}

export interface SpaceBooking {
  resourceName: string;
}

export interface OwmForecastEntry {
  dt: number;
  main: { temp: number };
  weather: { id: number; main: string }[];
  clouds: { all: number };
}

export interface OwmForecastResponse {
  cod: string;
  list: OwmForecastEntry[];
}

export interface MapQuestIncident {
  id: string;
  type: number;
  severity: number;
  fullDesc: string;
  parameterizedDescription: {
    roadName: string;
    crossRoad1: string;
  };
}

export interface MapQuestTrafficResponse {
  incidents: MapQuestIncident[];
}

export interface Business {
  suite: string;
  company: string;
  company2: string;
  logo1: string;
  logo2: string;
}

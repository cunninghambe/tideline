import { z } from 'zod';

// ---------------------------------------------------------------------------
// Open-Meteo API response schema (spec §7)
// ---------------------------------------------------------------------------

export const OpenMeteoResponse = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    surface_pressure: z.number(),
    wind_speed_10m: z.number(),
    uv_index: z.number().nullable(),
    weather_code: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    surface_pressure: z.array(z.number()),
  }),
});

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type OpenMeteoResponse = z.infer<typeof OpenMeteoResponse>;

// ---------------------------------------------------------------------------
// Settings KV schema
// ---------------------------------------------------------------------------

export const SettingsValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export type SettingsValue = z.infer<typeof SettingsValueSchema>;

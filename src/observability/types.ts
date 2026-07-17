import type { EventEnvelope } from "@uh-oh/react-native";

export type Breadcrumb = EventEnvelope["breadcrumbs"][number];

export type ErrorWhere =
  | "migrations"
  | "scheduleDailyCheckinReminder"
  | "weatherFetch"
  | "fontLoading"
  | "supabaseSync"
  | "poolIngest"
  | "render"
  | "unknown";

export type ErrorContext = {
  where: ErrorWhere;
  extra?: Record<string, string | number | boolean | null>;
};

export type ScrubResult =
  | { kind: "send"; event: EventEnvelope }
  | { kind: "drop"; reason: string };

export type { EventEnvelope };

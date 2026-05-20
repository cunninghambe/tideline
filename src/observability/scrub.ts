import type { EventEnvelope, Breadcrumb, ScrubResult } from "./types";

export const DENYLIST_PATTERN =
  /note|gps|location|hex|cycle|brand|severity|symptom|food|jwt|token|password|secret/i;

const TIDELINE_PATH_RE = /\/tideline\/(.+)$/;
const BRACKET_OR_QUERY_RE = /(\[[^\]]+\])|(\?.*$)/g;
const SEGMENT_WITH_DIGIT_RE = /\d/;

function containsDenylist(value: unknown): boolean {
  return typeof value === "string" && DENYLIST_PATTERN.test(value);
}

function stripDenylistKeys<T extends Record<string, unknown>>(
  obj: T | undefined,
): T | undefined {
  if (!obj) return obj;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (DENYLIST_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out as T;
}

function normaliseFilename(
  filename: string | undefined,
): string | undefined {
  if (!filename) return filename;
  const m = filename.match(TIDELINE_PATH_RE);
  return m ? m[1] : filename;
}

function redactUrl(url: unknown): string {
  if (typeof url !== "string") return "<unparseable>/<redacted>";
  try {
    const u = new URL(url);
    return `${u.host}/<redacted>`;
  } catch {
    return "<unparseable>/<redacted>";
  }
}

function stripRouteParams(route: unknown): string | undefined {
  if (typeof route !== "string") return undefined;
  const noBracketsOrQuery = route.replace(BRACKET_OR_QUERY_RE, (match) =>
    match.startsWith("?") ? "" : "<param>",
  );
  return noBracketsOrQuery
    .split("/")
    .map((seg) =>
      seg !== "<param>" && SEGMENT_WITH_DIGIT_RE.test(seg) ? "<param>" : seg,
    )
    .join("/");
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function setIfDefined(
  obj: Record<string, JsonValue>,
  key: string,
  value: JsonValue | undefined,
): void {
  if (value !== undefined) obj[key] = value;
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  const category = crumb.category;

  if (category === "console" && containsDenylist(crumb.message)) {
    return null;
  }

  if (category === "navigation") {
    const data: Record<string, JsonValue> = { ...(crumb.data ?? {}) };
    const from = stripRouteParams(crumb.data?.from);
    const to = stripRouteParams(crumb.data?.to);
    setIfDefined(data, "from", from);
    setIfDefined(data, "to", to);
    return { ...crumb, data };
  }

  if (category === "http") {
    const data = crumb.data ?? {};
    const next: Record<string, JsonValue> = {};
    setIfDefined(next, "method", data.method);
    setIfDefined(next, "status_code", data.status_code);
    if ("url" in data) next.url = redactUrl(data.url);
    return { ...crumb, data: next };
  }

  if (category === "ui.click") {
    const data = crumb.data ?? {};
    const next: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(data)) {
      if (k === "label") continue;
      next[k] = v;
    }
    return { ...crumb, data: next };
  }

  return crumb;
}

export function scrubEvent(event: EventEnvelope): ScrubResult {
  if (containsDenylist(event.exception?.value)) {
    return { kind: "drop", reason: "exception.value matched denylist" };
  }

  const frames = event.exception?.stacktrace;
  if (frames) {
    for (const frame of frames) {
      if (containsDenylist(frame.filename) || containsDenylist(frame.function)) {
        return { kind: "drop", reason: "stack frame matched denylist" };
      }
    }
  }

  const next: EventEnvelope = { ...event };

  if (frames) {
    next.exception = {
      ...event.exception,
      stacktrace: frames.map((frame) => ({
        ...frame,
        filename: normaliseFilename(frame.filename),
      })),
    };
  }

  if (event.user) {
    next.user = event.user.id ? { id: event.user.id } : undefined;
  }

  next.tags = stripDenylistKeys(event.tags);
  next.context = stripDenylistKeys(event.context);

  if (Array.isArray(event.breadcrumbs)) {
    const scrubbed: Breadcrumb[] = [];
    for (const crumb of event.breadcrumbs) {
      const out = scrubBreadcrumb(crumb);
      if (out) scrubbed.push(out);
    }
    next.breadcrumbs = scrubbed;
  }

  return { kind: "send", event: next };
}

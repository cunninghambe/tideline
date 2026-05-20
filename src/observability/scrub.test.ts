import { describe, it, expect } from "vitest";
import { scrubEvent, scrubBreadcrumb, DENYLIST_PATTERN } from "./scrub";
import type { EventEnvelope, Breadcrumb } from "./types";

const baseException = (overrides: Partial<EventEnvelope["exception"]> = {}) =>
  ({
    type: "Error",
    value: "boom",
    stacktrace: [],
    mechanism: "js-manual",
    ...overrides,
  }) as EventEnvelope["exception"];

const baseEvent = (overrides: Partial<EventEnvelope> = {}): EventEnvelope =>
  ({
    sdk: { name: "@uh-oh/react-native", version: "0.0.1" },
    timestamp: "2026-05-19T16:00:00.000Z",
    platform: "android",
    release: { version: "1.0.0", build: "0" },
    level: "error",
    exception: baseException(),
    breadcrumbs: [],
    device: { osName: "Android", osVersion: "13" },
    ...overrides,
  }) as EventEnvelope;

const baseBreadcrumb = (overrides: Partial<Breadcrumb> = {}): Breadcrumb =>
  ({
    category: "console",
    message: "",
    level: "info",
    ts: "2026-05-19T16:00:00.000Z",
    ...overrides,
  }) as Breadcrumb;

describe("DENYLIST_PATTERN", () => {
  it("matches all spec-defined sensitive substrings, case-insensitive", () => {
    const sensitives = [
      "note",
      "notes",
      "NOTE",
      "gps",
      "location",
      "hex",
      "cycle",
      "brand",
      "severity",
      "symptom",
      "food",
      "jwt",
      "token",
      "password",
      "secret",
    ];
    for (const s of sensitives) {
      expect(DENYLIST_PATTERN.test(s)).toBe(true);
    }
  });

  it("does not match benign substrings", () => {
    const benign = [
      "id",
      "where",
      "release",
      "os",
      "route",
      "status",
      "method",
      "host",
    ];
    for (const s of benign) {
      expect(DENYLIST_PATTERN.test(s)).toBe(false);
    }
  });
});

describe("scrubEvent", () => {
  it("keeps a clean event with no PII", () => {
    const event = baseEvent({
      exception: baseException({ value: "Failed to insert migraine row" }),
      tags: { "tideline.where": "migrations" },
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    expect(result.event.exception.value).toBe("Failed to insert migraine row");
    expect(result.event.tags?.["tideline.where"]).toBe("migrations");
  });

  it("drops the event when exception.value contains a denylist substring", () => {
    const event = baseEvent({
      exception: baseException({
        value: "failed to insert note 'migraine ended at 14:00'",
      }),
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("drop");
    if (result.kind !== "drop") throw new Error("unreachable");
    expect(result.reason).toMatch(/denylist/i);
  });

  it("drops the event when a stack frame filename contains denylist", () => {
    const event = baseEvent({
      exception: baseException({
        value: "boom",
        stacktrace: [
          { filename: "src/db/notes-secret.ts", lineno: 1, inApp: true },
        ],
      }),
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("drop");
  });

  it("strips tag keys that match the denylist", () => {
    const event = baseEvent({
      tags: {
        "tideline.where": "weatherFetch",
        "user.gps": "50.1,14.4",
        "user.cycle": "day-14",
      },
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    expect(result.event.tags?.["tideline.where"]).toBe("weatherFetch");
    expect(result.event.tags?.["user.gps"]).toBeUndefined();
    expect(result.event.tags?.["user.cycle"]).toBeUndefined();
  });

  it("strips context keys that match the denylist", () => {
    const event = baseEvent({
      context: {
        runtime: { name: "hermes" },
        notes: { last: "I had wine" },
        brandUsage: { ibuprofen: 3 },
      },
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    expect(result.event.context?.runtime).toEqual({ name: "hermes" });
    expect(result.event.context?.notes).toBeUndefined();
    expect(result.event.context?.brandUsage).toBeUndefined();
  });

  it("deletes event.user fields except id", () => {
    const event = baseEvent({
      user: {
        id: "01HX0000000000000000000000",
        email: "nadia@example.com",
        username: "nadia",
      },
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    expect(result.event.user?.id).toBe("01HX0000000000000000000000");
    expect(result.event.user?.email).toBeUndefined();
    expect(result.event.user?.username).toBeUndefined();
  });

  it("rewrites stack frame absolute paths to be relative to tideline/", () => {
    const event = baseEvent({
      exception: baseException({
        value: "boom",
        stacktrace: [
          { filename: "/root/tideline/src/db/client.ts", lineno: 42, inApp: true },
          {
            filename: "/Users/brad/work/tideline/app/_layout.tsx",
            lineno: 30,
            inApp: true,
          },
          { filename: "/some/path/without/marker.js", lineno: 1, inApp: false },
        ],
      }),
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    const frames = result.event.exception.stacktrace;
    expect(frames[0]?.filename).toBe("src/db/client.ts");
    expect(frames[1]?.filename).toBe("app/_layout.tsx");
    expect(frames[2]?.filename).toBe("/some/path/without/marker.js");
  });

  it("survives malformed event input (missing optional fields)", () => {
    const event = baseEvent({});
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
  });

  it("survives malformed stack frames (missing filename)", () => {
    const event = baseEvent({
      exception: baseException({
        value: "boom",
        stacktrace: [
          { inApp: true } as EventEnvelope["exception"]["stacktrace"][number],
          { lineno: 5, inApp: false } as EventEnvelope["exception"]["stacktrace"][number],
        ],
      }),
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
  });

  it("scrubs breadcrumbs in the envelope", () => {
    const event = baseEvent({
      breadcrumbs: [
        baseBreadcrumb({ category: "console", message: "logged token=abc123" }),
        baseBreadcrumb({ category: "console", message: "app booted" }),
        baseBreadcrumb({
          category: "http",
          message: "GET",
          data: {
            url: "https://api.open-meteo.com/v1/forecast?latitude=50.1",
            method: "GET",
            status_code: 200,
          },
        }),
      ],
    });
    const result = scrubEvent(event);
    expect(result.kind).toBe("send");
    if (result.kind !== "send") throw new Error("unreachable");
    expect(result.event.breadcrumbs).toHaveLength(2);
    expect(result.event.breadcrumbs[0]?.message).toBe("app booted");
    expect(result.event.breadcrumbs[1]?.data?.url).toBe(
      "api.open-meteo.com/<redacted>",
    );
  });
});

describe("scrubBreadcrumb", () => {
  it("keeps a clean navigation breadcrumb with route-only data", () => {
    const crumb = baseBreadcrumb({
      category: "navigation",
      message: "nav",
      data: { from: "/calendar", to: "/day/2026-05-16" },
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.data?.from).toBe("/calendar");
    expect(result?.data?.to).toBe("/day/<param>");
  });

  it("strips bracketed route params from navigation breadcrumbs", () => {
    const crumb = baseBreadcrumb({
      category: "navigation",
      message: "nav",
      data: { from: "/calendar", to: "/meds/[id]?refill=true" },
    });
    const result = scrubBreadcrumb(crumb);
    expect(result?.data?.to).toBe("/meds/<param>");
  });

  it("redacts http breadcrumb URLs to host only", () => {
    const crumb = baseBreadcrumb({
      category: "http",
      message: "GET",
      data: {
        url: "https://api.open-meteo.com/v1/forecast?latitude=50.1&longitude=14.4",
        method: "GET",
        status_code: 200,
      },
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.data?.url).toBe("api.open-meteo.com/<redacted>");
    expect(result?.data?.method).toBe("GET");
    expect(result?.data?.status_code).toBe(200);
  });

  it("drops console breadcrumbs whose message contains a denylist substring", () => {
    const crumb = baseBreadcrumb({
      category: "console",
      message: "logged token=abc123",
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).toBeNull();
  });

  it("keeps benign console breadcrumbs", () => {
    const crumb = baseBreadcrumb({
      category: "console",
      message: "app booted",
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.message).toBe("app booted");
  });

  it("strips data.label from ui.click breadcrumbs, keeps testID", () => {
    const crumb = baseBreadcrumb({
      category: "ui.click",
      message: "click",
      data: {
        label: "Wine, 2 glasses (might be a trigger)",
        testID: "food-tag-wine",
      },
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.data?.label).toBeUndefined();
    expect(result?.data?.testID).toBe("food-tag-wine");
  });

  it("passes through unknown categories unchanged", () => {
    const crumb = baseBreadcrumb({
      category: "transaction",
      message: "commit",
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.message).toBe("commit");
  });

  it("survives malformed breadcrumbs (missing data)", () => {
    expect(
      scrubBreadcrumb(baseBreadcrumb({ category: "http", message: "GET" })),
    ).not.toBeNull();
    expect(
      scrubBreadcrumb(
        baseBreadcrumb({ category: "http", message: "GET", data: {} }),
      ),
    ).not.toBeNull();
  });

  it("survives http breadcrumb with non-URL string in data.url", () => {
    const crumb = baseBreadcrumb({
      category: "http",
      message: "GET",
      data: { url: "not-a-url", method: "GET" },
    });
    const result = scrubBreadcrumb(crumb);
    expect(result).not.toBeNull();
    expect(result?.data?.url).toBe("<unparseable>/<redacted>");
  });
});

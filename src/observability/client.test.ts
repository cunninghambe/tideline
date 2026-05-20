import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockInit, mockCaptureException, mockSetUser } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCaptureException: vi.fn(),
  mockSetUser: vi.fn(),
}));

vi.mock("@uh-oh/react-native", () => ({
  init: mockInit,
  captureException: mockCaptureException,
  setUser: mockSetUser,
}));

// eslint-disable-next-line import/first
import {
  initObservability,
  reportError,
  setInstallId,
  __resetForTests,
} from "./client";

const TEST_DSN =
  "http://fde902e1422064b319a5cd1df72401b1752aea1f68ff2c25cb8c3c4113f0b135@5.161.200.212:8300";

describe("initObservability", () => {
  beforeEach(() => {
    __resetForTests();
    mockInit.mockReset();
    mockCaptureException.mockReset();
    mockSetUser.mockReset();
    delete process.env.EXPO_PUBLIC_UH_OH_DSN;
    delete process.env.EXPO_PUBLIC_APP_VERSION;
    delete process.env.EXPO_PUBLIC_APP_BUILD;
  });

  it("no-ops and logs once when DSN is missing", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    initObservability();
    initObservability();
    initObservability();
    expect(mockInit).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      "[observability] DSN not set — disabled",
    );
    logSpy.mockRestore();
  });

  it("calls uh-oh init with DSN, release, and beforeSend hook", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    process.env.EXPO_PUBLIC_APP_VERSION = "1.2.3";
    process.env.EXPO_PUBLIC_APP_BUILD = "42";
    initObservability();
    expect(mockInit).toHaveBeenCalledTimes(1);
    const opts = mockInit.mock.calls[0][0];
    expect(opts.dsn).toBe(TEST_DSN);
    expect(opts.release).toBe("1.2.3+42");
    expect(typeof opts.beforeSend).toBe("function");
  });

  it("defaults release to 0.0.0+0 if env vars missing", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    const opts = mockInit.mock.calls[0][0];
    expect(opts.release).toBe("0.0.0+0");
  });

  it("is idempotent — subsequent calls do not re-init", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    initObservability();
    initObservability();
    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it("disables itself and does not crash if uh-oh init throws", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    mockInit.mockImplementation(() => {
      throw new Error("native module missing");
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => initObservability()).not.toThrow();
    expect(reportError(new Error("post-fail"), { where: "unknown" })).toBeNull();
    logSpy.mockRestore();
  });

  it("beforeSend forwards to scrubEvent — clean events pass through", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    const opts = mockInit.mock.calls[0][0];
    const cleanEnvelope = {
      sdk: { name: "@uh-oh/react-native", version: "0.0.1" },
      timestamp: "2026-05-19T16:00:00.000Z",
      platform: "android",
      release: { version: "1.0.0", build: "0" },
      level: "error",
      exception: {
        type: "Error",
        value: "clean error",
        stacktrace: [],
        mechanism: "js-manual",
      },
      breadcrumbs: [],
      device: { osName: "Android", osVersion: "13" },
    };
    const result = opts.beforeSend(cleanEnvelope);
    expect(result).not.toBeNull();
    expect(result.exception.value).toBe("clean error");
  });

  it("beforeSend returns null when scrubber drops the event", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    const opts = mockInit.mock.calls[0][0];
    const dirty = {
      sdk: { name: "@uh-oh/react-native", version: "0.0.1" },
      timestamp: "2026-05-19T16:00:00.000Z",
      platform: "android",
      release: { version: "1.0.0", build: "0" },
      level: "error",
      exception: {
        type: "Error",
        value: "leaked note: 'I had wine'",
        stacktrace: [],
        mechanism: "js-manual",
      },
      breadcrumbs: [],
      device: { osName: "Android", osVersion: "13" },
    };
    const result = opts.beforeSend(dirty);
    expect(result).toBeNull();
  });
});

describe("reportError", () => {
  beforeEach(() => {
    __resetForTests();
    mockInit.mockReset();
    mockCaptureException.mockReset();
    mockSetUser.mockReset();
    delete process.env.EXPO_PUBLIC_UH_OH_DSN;
  });

  it("returns null when observability is disabled (no DSN)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    initObservability();
    const id = reportError(new Error("boom"), { where: "migrations" });
    expect(id).toBeNull();
    expect(mockCaptureException).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("captures with tags and extra when initialised", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    mockCaptureException.mockReturnValue("event-id-123");
    initObservability();
    const id = reportError(new Error("boom"), {
      where: "migrations",
      extra: { step: "creating-table" },
    });
    expect(id).toBe("event-id-123");
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { "tideline.where": "migrations" },
      extra: { step: "creating-table" },
    });
  });

  it("buffers errors when called before init, then flushes on init", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    mockCaptureException.mockReturnValue("flushed-id");
    reportError(new Error("pre-init-1"), { where: "weatherFetch" });
    reportError(new Error("pre-init-2"), { where: "migrations" });
    expect(mockCaptureException).not.toHaveBeenCalled();
    initObservability();
    expect(mockCaptureException).toHaveBeenCalledTimes(2);
  });

  it("caps the pre-init buffer at 50 entries (drops oldest)", () => {
    for (let i = 0; i < 55; i++) {
      reportError(new Error(`pre-${i}`), { where: "unknown" });
    }
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    mockCaptureException.mockReturnValue("id");
    initObservability();
    expect(mockCaptureException).toHaveBeenCalledTimes(50);
    const firstFlushedErr = mockCaptureException.mock.calls[0][0] as Error;
    expect(firstFlushedErr.message).toBe("pre-5");
  });

  it("returns null and does not throw if captureException throws", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    mockCaptureException.mockImplementation(() => {
      throw new Error("transport offline");
    });
    expect(reportError(new Error("boom"), { where: "unknown" })).toBeNull();
  });

  it("returns null when captureException returns an empty string", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    mockCaptureException.mockReturnValue("");
    initObservability();
    expect(reportError(new Error("boom"), { where: "unknown" })).toBeNull();
  });
});

describe("setInstallId", () => {
  beforeEach(() => {
    __resetForTests();
    mockInit.mockReset();
    mockSetUser.mockReset();
    delete process.env.EXPO_PUBLIC_UH_OH_DSN;
  });

  it("no-ops when observability is disabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    initObservability();
    setInstallId("01HX0000000000000000000000");
    expect(mockSetUser).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("calls uh-oh setUser with id only when initialised", () => {
    process.env.EXPO_PUBLIC_UH_OH_DSN = TEST_DSN;
    initObservability();
    setInstallId("01HX0000000000000000000000");
    expect(mockSetUser).toHaveBeenCalledWith({ id: "01HX0000000000000000000000" });
  });
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_UH_OH_DSN;
  delete process.env.EXPO_PUBLIC_APP_VERSION;
  delete process.env.EXPO_PUBLIC_APP_BUILD;
});

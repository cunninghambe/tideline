import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockReportError } = vi.hoisted(() => ({
  mockReportError: vi.fn(),
}));

vi.mock("./client", () => ({
  reportError: mockReportError,
}));

vi.mock("react-native", () => {
  const make = (name: string) => {
    const C = ({
      children,
      ...props
    }: {
      children?: unknown;
      [k: string]: unknown;
    }) => ({
      type: name,
      props: { ...props, children },
    });
    return C;
  };
  return {
    View: make("View"),
    Text: make("Text"),
    Pressable: make("Pressable"),
  };
});

// eslint-disable-next-line import/first
import { RootErrorBoundary } from "./error-boundary";

describe("RootErrorBoundary", () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });

  it("getDerivedStateFromError captures the error into state", () => {
    const err = new Error("boom");
    const next = RootErrorBoundary.getDerivedStateFromError(err);
    expect(next).toEqual({ error: err });
  });

  it("componentDidCatch forwards to reportError with where=render", () => {
    const instance = new RootErrorBoundary({ children: null });
    instance.state = { error: null };
    const err = new Error("render-fail");
    instance.componentDidCatch(err);
    expect(mockReportError).toHaveBeenCalledWith(err, { where: "render" });
  });

  it("componentDidCatch is silent if reportError throws", () => {
    const instance = new RootErrorBoundary({ children: null });
    instance.state = { error: null };
    mockReportError.mockImplementation(() => {
      throw new Error("telemetry failed");
    });
    expect(() => instance.componentDidCatch(new Error("boom"))).not.toThrow();
  });

  it("componentDidCatch does not re-report when in the hard-fallback state", () => {
    const instance = new RootErrorBoundary({ children: null });
    instance.state = { error: new Error("first") };
    instance.fallbackFailed = true;
    instance.componentDidCatch(new Error("second"));
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("handleTryAgain clears the error from state", () => {
    const instance = new RootErrorBoundary({ children: null });
    instance.state = { error: new Error("boom") };
    const setStateSpy = vi
      .spyOn(instance, "setState")
      .mockImplementation(() => {});
    instance.handleTryAgain();
    expect(setStateSpy).toHaveBeenCalledWith({ error: null });
  });

  it("render returns children when there is no error", () => {
    const children = { type: "mock-children" };
    const instance = new RootErrorBoundary({ children: children as never });
    instance.state = { error: null };
    expect(instance.render()).toBe(children);
  });

  it("render returns a fallback element when error is set", () => {
    const instance = new RootErrorBoundary({ children: null });
    instance.state = { error: new Error("boom") };
    const out = instance.render();
    expect(out).toBeTruthy();
    expect(typeof out).toBe("object");
  });
});

import { vi } from "vitest";

vi.mock("@uh-oh/react-native", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  setFingerprint: vi.fn(),
  captureMessage: vi.fn(),
}));

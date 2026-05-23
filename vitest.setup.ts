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

// Default mock: empty expoConfig so client.ts falls through to env-var
// path in tests. Individual tests can override via vi.mocked(Constants).
vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {},
      version: undefined,
      android: {},
      ios: {},
    },
  },
}));

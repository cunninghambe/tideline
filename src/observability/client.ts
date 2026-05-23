import Constants from "expo-constants";
import * as UhOh from "@uh-oh/react-native";
import { scrubEvent } from "./scrub";
import type { ErrorContext, EventEnvelope } from "./types";

const MAX_BUFFERED = 50;

type Buffered = { err: unknown; ctx: ErrorContext };

let _initialized = false;
let _disabled = false;
let _dsnWarningLogged = false;
const _buffer: Buffered[] = [];

// DSN resolution order: app.json `expo.extra.uhOhDsn` → env var fallback.
// The extra-config path is the canonical one in EAS builds because
// `EXPO_PUBLIC_*` env vars from eas.json don't always reach the Metro
// bundler at build time (observed on SDK 54 / EAS preview profile,
// 2026-05-22). The env fallback keeps tests and ad-hoc dev configurable
// without app.json edits.
function readDsn(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const fromExtra = extra.uhOhDsn;
  if (typeof fromExtra === "string" && fromExtra.length > 0) return fromExtra;
  const fromEnv = process.env.EXPO_PUBLIC_UH_OH_DSN;
  return typeof fromEnv === "string" && fromEnv.length > 0 ? fromEnv : undefined;
}

function readRelease(): string {
  const version =
    Constants.expoConfig?.version ?? process.env.EXPO_PUBLIC_APP_VERSION ?? "0.0.0";
  const androidBuild = Constants.expoConfig?.android?.versionCode;
  const iosBuild = Constants.expoConfig?.ios?.buildNumber;
  const build =
    (typeof androidBuild === "number" ? String(androidBuild) : undefined) ??
    (typeof iosBuild === "string" ? iosBuild : undefined) ??
    process.env.EXPO_PUBLIC_APP_BUILD ??
    "0";
  return `${version}+${build}`;
}

export function initObservability(): void {
  if (_initialized || _disabled) return;
  const dsn = readDsn();
  if (!dsn) {
    _disabled = true;
    if (!_dsnWarningLogged) {
      _dsnWarningLogged = true;
      console.log("[observability] DSN not set — disabled");
    }
    return;
  }
  try {
    UhOh.init({
      dsn,
      release: readRelease(),
      beforeSend: (event: EventEnvelope): EventEnvelope | null => {
        const result = scrubEvent(event);
        return result.kind === "send" ? result.event : null;
      },
    });
    _initialized = true;
    flushBuffer();
  } catch (e: unknown) {
    _disabled = true;
    console.log("[observability] uh-oh init threw, disabled", e);
  }
}

function flushBuffer(): void {
  while (_buffer.length > 0) {
    const next = _buffer.shift();
    if (next) capture(next.err, next.ctx);
  }
}

function capture(err: unknown, ctx: ErrorContext): string | null {
  try {
    const id = UhOh.captureException(err, {
      tags: { "tideline.where": ctx.where },
      extra: ctx.extra,
    });
    return typeof id === "string" && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function reportError(err: unknown, ctx: ErrorContext): string | null {
  if (_disabled) return null;
  if (!_initialized) {
    if (_buffer.length >= MAX_BUFFERED) _buffer.shift();
    _buffer.push({ err, ctx });
    return null;
  }
  return capture(err, ctx);
}

export function setInstallId(installId: string): void {
  if (_disabled || !_initialized) return;
  try {
    UhOh.setUser({ id: installId });
  } catch {
    // setUser failure is non-fatal
  }
}

export function __resetForTests(): void {
  _initialized = false;
  _disabled = false;
  _dsnWarningLogged = false;
  _buffer.length = 0;
}

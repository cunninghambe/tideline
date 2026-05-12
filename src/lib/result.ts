export type AppError = {
  kind: 'network' | 'validation' | 'database' | 'permission' | 'unknown';
  message: string;
  cause?: unknown;
};

export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: AppError): Result<T> {
  return { ok: false, error };
}

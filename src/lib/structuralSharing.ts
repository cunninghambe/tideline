/**
 * Date-aware structural sharing for TanStack Query.
 *
 * The default `replaceEqualDeep` treats anything that isn't a plain object or
 * array as an opaque leaf compared by reference. Our Drizzle rows carry `Date`
 * columns (startedAt, capturedAt, …), so every refetch produces brand-new Date
 * instances and the default sharing gives the row — and therefore the whole
 * result array — a fresh reference even when nothing changed. Every memo,
 * effect, and component keyed on query data then re-fires on each
 * focus-invalidation refetch.
 *
 * This variant mirrors replaceEqualDeep but compares Dates by timestamp,
 * returning the previous value (preserving references) wherever the next
 * result is deep-equal.
 */
export function replaceEqualDateAware<T>(prev: unknown, next: T): T {
  if (Object.is(prev, next)) return prev as T;

  if (prev instanceof Date && next instanceof Date) {
    return (prev.getTime() === next.getTime() ? prev : next) as T;
  }

  if (Array.isArray(prev) && Array.isArray(next)) {
    const merged: unknown[] = new Array(next.length);
    let equal = prev.length === next.length;
    for (let i = 0; i < next.length; i++) {
      merged[i] = replaceEqualDateAware(prev[i], next[i]);
      if (merged[i] !== prev[i]) equal = false;
    }
    return (equal ? prev : merged) as T;
  }

  if (isPlainObject(prev) && isPlainObject(next)) {
    const nextKeys = Object.keys(next);
    const merged: Record<string, unknown> = {};
    let equal = Object.keys(prev).length === nextKeys.length;
    for (const key of nextKeys) {
      merged[key] = replaceEqualDateAware(prev[key], next[key]);
      if (merged[key] !== prev[key]) equal = false;
    }
    return (equal ? prev : merged) as T;
  }

  return next;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

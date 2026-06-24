/**
 * Deep-merge a content override over the defaults — client-safe, pure.
 *
 * Plain objects are merged key-by-key (so an override can set only `th` of a
 * Bilingual and keep the default `en`). Arrays and primitives are REPLACED
 * wholesale when present in the override. `undefined` / `null` override values
 * fall through to the base.
 */

type Plain = Record<string, unknown>;

function isPlainObject(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeContent<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base;
  }
  const out: Plain = { ...(base as Plain) };
  for (const key of Object.keys(override)) {
    const value = override[key];
    if (value === undefined) continue;
    out[key] = mergeContent((base as Plain)[key], value);
  }
  return out as T;
}

// Small helper for HMR-safe singletons in Next.js dev. In production it's
// just memoisation by name on the module-level cache.
//
// Pattern: every long-lived client (pg pool, Meilisearch client, drizzle db,
// the ImageSearch instance, …) wants to survive HMR reloads so we don't open a
// new connection on every file save. Each one used to repeat the same
//   `globalThis.__foo ??= factory()` dance with its own key.
// This function is that dance, once.

const GLOBAL_KEY = Symbol.for('app.cached') as unknown as string

type Cache = Map<string, unknown>

const cache: Cache =
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] as Cache | undefined) ??
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] = new Map())

export function cached<T>(key: string, factory: () => T): T {
  if (!cache.has(key)) cache.set(key, factory())
  return cache.get(key) as T
}

// Deterministic pseudo-random helpers so every visitor gets the same fictional demo data.

export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    bool: (probability = 0.5) => next() < probability,
  };
}

export type Random = ReturnType<typeof createRandom>;

/** A stable UUID-shaped id from a namespace and index, e.g. mockId('practice', 3). */
export function mockId(namespace: string, index: number) {
  let hash = 2166136261;
  for (const char of `${namespace}:${index}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const a = hex(hash);
  const b = hex(Math.imul(hash, 31) + index);
  const c = hex(Math.imul(hash ^ index, 131));
  const d = hex(Math.imul(hash, 7919) ^ 0x5bd1e995);
  return `${a}-${b.slice(0, 4)}-4${b.slice(5, 8)}-a${c.slice(1, 4)}-${c.slice(4)}${d}`;
}

/** ISO timestamp `daysAgo` days before the fixed demo date, so data doesn't drift between visits. */
export const DEMO_NOW = new Date('2026-10-27T09:00:00Z');
export function isoDaysAgo(daysAgo: number, hour = 9) {
  const date = new Date(DEMO_NOW);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

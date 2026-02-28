// Simple seeded pseudo-random number generator (mulberry32)
export function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSurvivalData(seed = 42) {
  const rng = createSeededRandom(seed);
  return Array.from({ length: 25 }, (_, i) => ({
    month: i * 2,
    treated: Math.max(0, 100 * Math.exp(-0.02 * i) + (rng() - 0.5) * 3),
    control: Math.max(0, 100 * Math.exp(-0.05 * i) + (rng() - 0.5) * 4),
    combined: Math.max(0, 100 * Math.exp(-0.015 * i) + (rng() - 0.5) * 2),
  }));
}

export function generateClonalData(seed = 123) {
  const rng = createSeededRandom(seed);
  return Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    return {
      timepoint: `T${i}`,
      clone1: Math.max(0, 60 * (1 - t) + (rng() - 0.5) * 5),
      clone2: Math.max(0, 20 + 30 * t * (1 - t * 0.5) + (rng() - 0.5) * 3),
      clone3: Math.max(0, 5 + 25 * t * t + (rng() - 0.5) * 3),
      clone4: Math.max(0, 2 + 10 * Math.pow(t, 3) + (rng() - 0.5) * 2),
    };
  });
}

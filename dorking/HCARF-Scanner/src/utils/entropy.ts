// src/utils/entropy.ts
export function shannonEntropy(str: string): number {
  const map = new Map();
  for (const c of str) map.set(c, (map.get(c) || 0) + 1);
  let entropy = 0;
  for (const [, count] of map) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

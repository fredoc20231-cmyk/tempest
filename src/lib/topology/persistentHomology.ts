/**
 * Sparse Vietoris–Rips persistent homology in dimension 1.
 *
 * Computes total H1 persistence on the symmetrized kNN graph using:
 *   - Union-Find for births (cycle-creating edges)
 *   - Triangle-closure deaths: for a cycle-birth edge (u,v) at ε_b,
 *     death ε_d = min over w ∈ N(u) ∩ N(v) of max(d(u,w), d(v,w), ε_b).
 *     If no common neighbor exists, ε_d = ε_cap (max edge length).
 *
 * This is a *sparse* VR-PH approximation restricted to the kNN edge set; it is
 * fully deterministic and reproducible. It is NOT a substitute for full Ripser
 * over the complete distance matrix, but it provides a principled persistence-
 * based H1 channel (z_L^VR) distinct from the graph-cycle-count surrogate.
 */

export interface VRPersistence {
  totalPersistence: number; // Σ (death - birth) over H1 generators
  numBars: number;
  L_VR: number; // alias for totalPersistence (engine-facing name)
}

export function computeVR_H1_persistence(
  indices: number[][],
  distances: number[][],
  n: number,
): VRPersistence {
  // Symmetrized neighbor table: vertex -> Map<neighbor, edgeWeight>
  const nbr: Map<number, number>[] = Array.from({ length: n }, () => new Map());
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < indices[i].length; t++) {
      const j = indices[i][t];
      const w = distances[i][t];
      const cur = nbr[i].get(j);
      if (cur === undefined || w < cur) nbr[i].set(j, w);
      const cur2 = nbr[j].get(i);
      if (cur2 === undefined || w < cur2) nbr[j].set(i, w);
    }
  }

  // Deduplicated edge list (u<v)
  const edges: { u: number; v: number; w: number }[] = [];
  let maxW = 0;
  for (let i = 0; i < n; i++) {
    nbr[i].forEach((w, j) => {
      if (j > i) {
        edges.push({ u: i, v: j, w });
        if (w > maxW) maxW = w;
      }
    });
  }
  edges.sort((a, b) => a.w - b.w);
  const epsCap = maxW > 0 ? maxW : 1;

  // Union-Find
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;
  const rank = new Int32Array(n);
  const find = (x: number): number => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a: number, b: number) => {
    a = find(a); b = find(b);
    if (a === b) return false;
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
    return true;
  };

  let total = 0;
  let bars = 0;

  for (const { u, v, w } of edges) {
    if (union(u, v)) continue; // tree edge, no H1 birth
    // Cycle birth at ε_b = w; find triangle-closure death.
    const birth = w;
    let death = epsCap;
    // Iterate smaller adjacency for common-neighbor search.
    const [a, b] = nbr[u].size <= nbr[v].size ? [u, v] : [v, u];
    nbr[a].forEach((wAW, wIdx) => {
      if (wIdx === b) return;
      const wBW = nbr[b].get(wIdx);
      if (wBW === undefined) return;
      const d = Math.max(birth, wAW, wBW);
      if (d < death) death = d;
    });
    const persist = Math.max(0, death - birth);
    total += persist;
    bars++;
  }

  return { totalPersistence: total, numBars: bars, L_VR: total };
}

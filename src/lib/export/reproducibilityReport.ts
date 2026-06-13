import { TEMPEST_VERSION, DISCLAIMER_FTTI, DISCLAIMER_SCOPE, PLATFORM_SCOPE } from "@/lib/scopeConfig";

export interface ReproParams {
  cohortName?: string;
  cohortSource?: "USER-UPLOADED" | "DEMO/SYNTHETIC" | "COMPUTED";
  seed: number;
  kNN?: number;
  nullReps?: number;
  bsReps?: number;
  topologyPrimary?: "VR" | "GCT";
  nPerCondition?: number;
  validityWarning?: string;
  modules: { module: string; evidenceType: string; provenance: string }[];
}

export function buildReproducibilityJson(p: ReproParams) {
  return {
    tempest_version: TEMPEST_VERSION,
    platform_scope: PLATFORM_SCOPE,
    generated_at: new Date().toISOString(),
    disclaimers: [DISCLAIMER_SCOPE, DISCLAIMER_FTTI],
    parameters: {
      seed: p.seed,
      kNN: p.kNN ?? 12,
      nullReps: p.nullReps ?? 50,
      bsReps: p.bsReps ?? 50,
      topology_primary: p.topologyPrimary ?? "VR",
      n_per_condition: p.nPerCondition ?? null,
    },
    dataset: { name: p.cohortName ?? null, provenance: p.cohortSource ?? "DEMO/SYNTHETIC" },
    validity_warning: p.validityWarning ?? null,
    modules: p.modules,
  };
}

export function buildMethodsSummary(p: ReproParams): string {
  return `# TEMPEST Methods Summary (${TEMPEST_VERSION})

${DISCLAIMER_SCOPE}

## Topology
- Primary channel: ${p.topologyPrimary === "GCT" ? "GCT (graph cycle approximation) — WARNING: approximation only; not primary manuscript score." : "VR-PH (Ripser-style H1, total persistence)."}
- Secondary channel: ${p.topologyPrimary === "GCT" ? "VR-PH (Ripser-style H1)" : "GCT (graph cycle approximation)"}.
- Composite score: fTTI_primary = z_B + z_L^VR + z_N. Legacy composite fTTI_GCT = z_B + z_L^GCT + z_N is retained for back-compat only.

## Parameters
- kNN: ${p.kNN ?? 12}
- Null permutations: ${p.nullReps ?? 50}
- Bootstrap resamples: ${p.bsReps ?? 50}
- RNG seed: ${p.seed}

## Validity gate
- n* = 25 samples per condition required for z_B / z_L / fTTI.
- Observed n/condition: ${p.nPerCondition ?? "n/a"}.
${p.validityWarning ? `- WARNING: ${p.validityWarning}` : ""}

## Dataset
- Name: ${p.cohortName ?? "n/a"}
- Provenance: ${p.cohortSource ?? "DEMO/SYNTHETIC"}

## Modules executed
${p.modules.map((m) => `- ${m.module}: evidence=${m.evidenceType}, provenance=${m.provenance}`).join("\n")}

## Disclaimer
${DISCLAIMER_FTTI}
`;
}

export function downloadReproBundle(p: ReproParams) {
  const json = JSON.stringify(buildReproducibilityJson(p), null, 2);
  const md = buildMethodsSummary(p);
  const dl = (name: string, content: string, mime: string) => {
    const a = document.createElement("a");
    a.download = name;
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.click();
    URL.revokeObjectURL(a.href);
  };
  dl("tempest_reproducibility.json", json, "application/json");
  dl("tempest_methods.md", md, "text/markdown");
}

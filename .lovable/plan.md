
# TEMPEST Scope & Rigor Hardening — Implementation Plan

Plan-mode only. No edits yet. All changes are frontend + one edge function update + shared libs. No DB schema changes required (provenance/evidence stored inside existing `analysis_results.results` JSON).

---

## 1. Global scope + disclaimer (Item 1)

**New:** `src/lib/scopeConfig.ts`
- Exports `PLATFORM_SCOPE = "state-separation and transition-dynamics framework"`.
- Exports `DISCLAIMER_FTTI = "fTTI threshold is proof-of-concept only; not validated for clinical stratification."`
- Exports forbidden-phrase list used by a dev-time lint script (`scripts/scope-lint.mjs`) to flag "prospective prediction", "clinical use", "clinically validated", "predicts outcome".

**Edit:**
- `src/components/tempest/Sidebar.tsx` — replace tagline/subtitle with `PLATFORM_SCOPE`.
- `src/components/tempest/HomePanel.tsx` — hero subtitle + persistent footer disclaimer banner.
- `src/components/tempest/ArticlePanel.tsx` — global search/replace of "prospective prediction" → "retrospective longitudinal evidence"; insert disclaimer block at top of Abstract and §Results.
- `src/components/tempest/ReportPanel.tsx` — append disclaimer to every exported report header.
- `index.html` — meta description updated to scope wording.

---

## 2. Persistent homology as primary topology (Item 2)

**New:** `src/lib/topology/persistentHomology.ts`
- Pure-TS VR filtration up to dim 1 (small-n: n ≤ ~200 samples is fine in-browser).
- Returns `{ H1_persistence: number[], total_persistence: number, z_L_VR: number }`.
- Existing `src/lib/ttiEngine.ts` already has GCT — keep, rename output to `z_L_GCT`.

**Edit:** `src/lib/ttiEngine.ts`
- Compute both channels; expose `{ z_B, z_L_VR, z_L_GCT, z_N, fTTI }` where  
  `fTTI = z_B + z_L_VR + z_N` (primary).  
  Secondary diagnostic: `fTTI_GCT = z_B + z_L_GCT + z_N`.
- Persist `topology_primary: "VR"` in the result payload.

**Edit:** `src/components/tempest/TTIPanel.tsx`
- Show both `z_L^VR` (primary, bold) and `z_L^GCT` (secondary, muted) side-by-side.
- Pearson r between the two displayed as concordance check.

---

## 3. Sample-size validity gate (Item 3)

**New:** `src/lib/validity.ts`
- `assessValidity(nPerCondition: number): { ok: boolean; allowed: ("z_N"|"cross_within"|"fiedler"|"z_B"|"z_L"|"fTTI")[]; warning?: string }`.
- Rule: `n < 25` → disable `z_B`, `z_L_*`, composite `fTTI`. Allowed: `z_N`, cross/within ratio, Fiedler λ2.

**Edit:**
- `src/lib/ttiEngine.ts` — gate composite assembly; return `validity` object on result.
- `src/components/tempest/TTIPanel.tsx`, `PredictivePanel.tsx`, `ImmuneRiskPanel.tsx` — render `<ValidityWarning />` and hide gated channels.

**New:** `src/components/tempest/ValidityWarning.tsx` — yellow alert: "z_B and z_L are invalid because n < 25 per condition."

---

## 4. Evidence-type labels (Item 4)

**New:** `src/components/tempest/EvidenceBadge.tsx`
- Variant enum: `"synthetic-ground-truth" | "endpoint-comparison" | "longitudinal-trajectory" | "prospective-prediction"`.
- Color-coded chip; tooltip explains semantics.

**Edit:**
- `src/lib/ttiEngine.ts` and `supabase/functions/run-analysis/index.ts` — attach `evidence_type` to every result. Default = `"endpoint-comparison"` unless input cohort has ≥2 timepoints (`cohorts.timepoints` non-empty array) → `"longitudinal-trajectory"`. Pitchfork module → `"synthetic-ground-truth"`. Never auto-assign `"prospective-prediction"`.
- All result-rendering panels (`ModulePanel`, `TTIPanel`, `PredictivePanel`, `ImmuneRiskPanel`, `ReportPanel`) render the badge near each metric table header.

---

## 5. Results Provenance badge (Item 5)

**New:** `src/components/tempest/ProvenanceBadge.tsx`
- Variants: `COMPUTED | USER-UPLOADED | DEMO/SYNTHETIC | PENDING VERIFICATION`.
- Distinct colors; `PENDING VERIFICATION` rendered with a striped amber background and `aria-label="not publication ready"`.

**Edit:**
- Result payloads tagged `provenance`: edge-function math → `COMPUTED`; cohort-derived raw stats → `USER-UPLOADED`; seeded demo/pitchfork → `DEMO/SYNTHETIC`; AI-narrated stubs without verification → `PENDING VERIFICATION`.
- `ReportPanel.tsx` export pipeline strips any block flagged `PENDING VERIFICATION` from the "publication-ready" PDF/HTML export and emits them only into a separate "Draft notes" appendix.

---

## 6. Synthetic pitchfork validation module (Item 6)

**New:** `src/lib/synthetic/pitchfork.ts`
- Simulate `dx/dt = r*x - x^3 + σ·η(t)` via Euler–Maruyama across an `r` grid spanning ±1.
- For each r: build sample set, compute `fTTI`, `DA-dist`, Fiedler `λ2`.
- True label: `r > 0`.
- Compute AUROC for each metric (`src/lib/stats/auroc.ts` — new helper).

**New:** `src/components/tempest/PitchforkValidationPanel.tsx`
- Run button + chart (recharts) of metric vs r and AUROC table.
- Wears `EvidenceBadge=synthetic-ground-truth` and `ProvenanceBadge=DEMO/SYNTHETIC`.

**Edit:** `src/components/tempest/PredictivePanel.tsx` — add third sub-tab "Validation (Synthetic)".

---

## 7. Benchmark comparison panel (Item 7)

**New:** `src/components/tempest/BenchmarkPanel.tsx`
- Computes DA-dist, Fiedler λ2, EMT-score (if gene map detects EMT genes via `src/lib/genes/emtSignature.ts`), and `z_N` on the active cohort.
- Side-by-side bar/table; AUROC only when ≥2 distinct classes present.
- Warning banner: "Benchmark is single-class; AUROC cannot be estimated."

**New:** `src/lib/genes/emtSignature.ts` — Hallmark EMT gene list + mean-zscore scorer.

**Edit:** Sidebar adds Benchmark inside the Predictive group (third sub-tab alongside Trajectory/TTI/Validation) — keeps top-level item count unchanged.

---

## 8. Longitudinal GEM visualization (Item 8)

**New:** `src/components/tempest/charts/LongitudinalGEMChart.tsx`
- Multi-line recharts: fTTI, Cheeger conductance φ, JSD over time.
- `ReferenceArea` for bifurcation window (auto-detected as argmax(JSD) ± 1 timepoint).
- Footer warning: "Retrospective longitudinal evidence; not prospective prediction."

**New:** `src/lib/topology/cheeger.ts` and `src/lib/stats/jsd.ts` (pure TS).

**Edit:** `TrajectoryPanel.tsx` mounts the new chart when active cohort has ≥3 timepoints; otherwise shows empty-state.

---

## 9. Neoantigen module safeguards (Item 9)

**New:** `src/components/tempest/NeoantigenPanel.tsx` + `src/lib/neoantigen/schema.ts`
- Required fields validation: `gene, mutation, peptide, allele, %Rank, n_timepoints, expression_status, germline_status`. Missing → row rejected with reason.
- Tiering rules:
  - `germline_status === "germline"` → forced out of Tier 1 (Tier 3 "germline-risk").
  - `gene === "MEIS1"` + `dbSNP === "rs239018671"` → exclude entirely.
  - When both `Amz1` and `Csprs` present: if `Amz1.expression_status === "confirmed"` and `Csprs.expression_status !== "confirmed"` → Amz1 ranked above Csprs regardless of %Rank tie-breakers.
- Renders tier table with `EvidenceBadge` + `ProvenanceBadge`.

**Edit:** Sidebar — replace existing neoantigen surface (currently inside ArticlePanel narrative) with a dedicated entry under Immune & Risk sub-tabs.

---

## 10. Export-ready outputs (Item 10)

**New:** `src/lib/export/`
- `csvTables.ts` — flatten any results object → CSV.
- `figurePng.ts` / `figureSvg.ts` — wrap existing `downloadChartAsPng` and add SVG passthrough; embed scope disclaimer in figure caption metadata.
- `methodsSummary.ts` — auto-generates Methods block from active config (topology=VR primary; GCT secondary; n-thresholds; seeds).
- `reproducibilityReport.ts` — JSON + Markdown bundle: parameters, RNG seed (`src/lib/seededRandom.ts` already exposes seed), dataset name + provenance, validity warnings, evidence-type per module, tempest version pin.

**Edit:** `src/components/tempest/ReportPanel.tsx`
- Replace single "Download HTML" button with an Export menu: CSV (per module), Figures (PNG+SVG zip), Methods.md, Reproducibility.json, plus existing HTML.
- Uses `JSZip` (add via `bun add jszip`) for the bundle.

---

## Cross-cutting touch list

Files edited:
- `src/components/tempest/Sidebar.tsx`
- `src/components/tempest/HomePanel.tsx`
- `src/components/tempest/ArticlePanel.tsx`
- `src/components/tempest/ReportPanel.tsx`
- `src/components/tempest/TTIPanel.tsx`
- `src/components/tempest/TrajectoryPanel.tsx`
- `src/components/tempest/PredictivePanel.tsx`
- `src/components/tempest/ImmuneRiskPanel.tsx`
- `src/components/tempest/ModulePanel.tsx`
- `src/lib/ttiEngine.ts`
- `supabase/functions/run-analysis/index.ts` (attach `evidence_type` + `provenance`)
- `index.html`

Files created:
- `src/lib/scopeConfig.ts`
- `src/lib/validity.ts`
- `src/lib/topology/persistentHomology.ts`
- `src/lib/topology/cheeger.ts`
- `src/lib/stats/jsd.ts`
- `src/lib/stats/auroc.ts`
- `src/lib/synthetic/pitchfork.ts`
- `src/lib/genes/emtSignature.ts`
- `src/lib/neoantigen/schema.ts`
- `src/lib/export/{csvTables,figurePng,figureSvg,methodsSummary,reproducibilityReport}.ts`
- `src/components/tempest/EvidenceBadge.tsx`
- `src/components/tempest/ProvenanceBadge.tsx`
- `src/components/tempest/ValidityWarning.tsx`
- `src/components/tempest/PitchforkValidationPanel.tsx`
- `src/components/tempest/BenchmarkPanel.tsx`
- `src/components/tempest/NeoantigenPanel.tsx`
- `src/components/tempest/charts/LongitudinalGEMChart.tsx`
- `scripts/scope-lint.mjs`

Dependencies: add `jszip` for the export bundle. No DB migrations.

Order of execution when approved: (1) shared libs (scopeConfig, validity, badges) → (2) ttiEngine + edge function metadata → (3) PH topology + UI swap → (4) panels (Pitchfork, Benchmark, Longitudinal GEM, Neoantigen) → (5) export bundle → (6) ArticlePanel/Sidebar/Home copy pass + lint script.

Reply "go" to start implementation, or call out items to drop/re-scope first.



# Fix TEMPEST: Error Recovery, Data Upload, Live Charts, Loading States

## 1. Pipeline Error Recovery (Retry/Reset UI)

**Problem:** When analysis fails, the module stays in "failed" state with no way to retry or reset.

**Solution:**
- Add a **"Retry"** and **"Reset"** button to `ModulePanel.tsx` that appears when `pipelineRun.status === "failed"`
- "Retry" calls `handleRunAnalysis` again
- "Reset" calls an update on `pipeline_runs` to set status back to `idle` and progress to `0`
- Add the same retry/reset controls in `OverviewPanel.tsx` next to failed pipeline entries
- Add a `resetPipeline(module)` function to `TempestContext.tsx` that updates the database row

**Files modified:**
- `src/contexts/TempestContext.tsx` -- add `resetPipeline(module)` method
- `src/components/tempest/ModulePanel.tsx` -- add Retry/Reset buttons when failed
- `src/components/tempest/OverviewPanel.tsx` -- add inline retry/reset on failed rows

---

## 2. Cohort Data Upload (CSV/TSV)

**Problem:** Cohort loading is hardcoded to one HGSOC demo dataset.

**Solution:**
- Add an **"Upload Cohort"** button to `ChatPanel.tsx` (next to quick actions) and a dedicated upload area
- Accept CSV/TSV files, parse them client-side to extract: name (from filename), sample count (rows), column headers as modalities
- Store uploaded cohort metadata in the `cohorts` table
- Create a Lovable Cloud storage bucket `cohort-uploads` for the raw files
- Show uploaded cohorts in a small dropdown/list so users can switch between them
- The AI chat can reference which cohort is active

**Files modified/created:**
- Database migration: create `cohort-uploads` storage bucket with public read policy
- `src/components/tempest/CohortUploader.tsx` -- new component: file input, CSV parser, upload to storage + insert cohort row
- `src/components/tempest/ChatPanel.tsx` -- integrate `CohortUploader` in the header area
- `src/contexts/TempestContext.tsx` -- add `activeCohort` state and setter
- `src/pages/Index.tsx` -- pass active cohort down

---

## 3. Charts Reflect AI Results

**Problem:** Survival curve, clonal dynamics, and radar charts always show static seeded data even after analysis completes.

**Solution:**
- When `analysisResults[module]` exists, transform the AI-generated metrics into chart-compatible data and pass it to chart components
- Each chart component already accepts an optional `data` prop; we just need to map AI results to the right shape
- For `RiskRadar`, add an optional `data` prop (currently missing)
- In `ModulePanel.tsx`, extract relevant metrics from `latestResult.results` and pass them as `data` to the chart
- In `OverviewPanel.tsx`, do the same for the three overview charts using any available results
- Add a utility function `mapResultsToChartData(module, results)` that transforms AI JSON into chart arrays

**Files modified/created:**
- `src/lib/chartDataMapper.ts` -- new utility to convert AI results JSON into chart-compatible arrays for each chart type
- `src/components/tempest/charts/RiskRadar.tsx` -- add optional `data` prop
- `src/components/tempest/ModulePanel.tsx` -- pass mapped AI data to charts
- `src/components/tempest/OverviewPanel.tsx` -- pass mapped AI data to overview charts

---

## 4. Loading and Empty States

**Problem:** On first visit, "No pipeline data yet" shows because seed data may not exist; no loading indicators while data fetches.

**Solution:**
- Add `loading` boolean states to `TempestContext` for pipeline, results, and cohorts
- Show skeleton placeholders in `OverviewPanel.tsx` while pipeline data loads
- Show skeleton rows in the pipeline status table
- In `ModulePanel.tsx`, show a skeleton for results while loading
- Replace "No pipeline data yet" with a proper empty state with a CTA: "Run your first analysis to see pipeline status"
- Use the existing `Skeleton` component from `src/components/ui/skeleton.tsx`

**Files modified:**
- `src/contexts/TempestContext.tsx` -- add `isLoading` state, expose it
- `src/components/tempest/OverviewPanel.tsx` -- render skeletons when `isLoading`, better empty state with CTA
- `src/components/tempest/ModulePanel.tsx` -- skeleton for results section when loading
- `src/components/tempest/StatusBar.tsx` -- show "Loading..." instead of "0 datasets" while loading

---

## Technical Details

### New files
- `src/lib/chartDataMapper.ts` -- maps AI result metrics to chart-compatible data structures
- `src/components/tempest/CohortUploader.tsx` -- CSV/TSV file upload component

### Database changes
- Create storage bucket `cohort-uploads` (migration)

### Modified files (summary)

| File | Changes |
|------|---------|
| `TempestContext.tsx` | Add `resetPipeline`, `activeCohort`, `isLoading` |
| `ModulePanel.tsx` | Retry/Reset buttons, pass AI data to charts, loading skeletons |
| `OverviewPanel.tsx` | Retry/Reset on failed rows, AI data to charts, loading skeletons, better empty state |
| `StatusBar.tsx` | Loading state handling |
| `ChatPanel.tsx` | Integrate CohortUploader |
| `RiskRadar.tsx` | Add optional `data` prop |

### Implementation order
1. Context changes (loading states, resetPipeline, activeCohort)
2. Loading/empty states in Overview, Module, StatusBar
3. Error recovery (retry/reset) in Module and Overview
4. Chart data mapper + wire AI results to charts
5. Cohort upload (storage bucket + component + integration)


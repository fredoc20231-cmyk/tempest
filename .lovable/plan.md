

# Make TEMPEST Fully Functional

This plan transforms the TEMPEST platform from a static prototype into a fully functional application with real AI-powered analysis, persistent data, and interactive pipeline management.

## Overview

```text
+------------------+     +-------------------+     +------------------+
|   React Frontend | --> | Supabase Edge Fns | --> | Supabase Database|
|   (existing UI)  |     | - chat (AI)       |     | - pipeline_runs  |
|                  |     | - run-analysis    |     | - analysis_results|
|                  | <-- |                   | <-- | - chat_messages  |
+------------------+     +-------------------+     +------------------+
                                |
                                v
                        +------------------+
                        | Lovable AI       |
                        | (Gemini 3 Flash) |
                        +------------------+
```

## Phase 1: Enable Lovable Cloud + Database

- Enable Lovable Cloud for the project
- Create database tables via migration:
  - `pipeline_runs`: tracks module status (module, status, progress, started_at, completed_at)
  - `analysis_results`: stores results per module (module, results_json, config_json, created_at)
  - `chat_messages`: persists conversation history (role, content, tools, action, created_at)
  - `cohorts`: stores loaded cohort data (name, samples, timepoints, modalities, tensor_shape, etc.)
- Seed initial pipeline states and default cohort data

## Phase 2: Real AI Chat via Edge Function

- Create `supabase/functions/chat/index.ts` edge function:
  - Connects to Lovable AI gateway (`google/gemini-3-flash-preview`)
  - System prompt instructs the AI to act as a TEMPEST biomedical research agent with knowledge of HGSOC, MOTF pipeline, survival analysis, clonal dynamics, and neoantigen prediction
  - Supports streaming (SSE) for token-by-token display
  - Handles 429/402 rate limit errors
- Update `ChatPanel.tsx`:
  - Replace `sampleResponses` keyword matching with real API calls to the edge function
  - Implement SSE streaming with progressive message rendering
  - Persist messages to `chat_messages` table
  - Keep quick-action buttons but wire them to send actual prompts
  - Parse AI responses for action suggestions (module navigation)

## Phase 3: Functional Pipeline ("Run Analysis" + Status)

- Create `supabase/functions/run-analysis/index.ts` edge function:
  - Accepts module name, updates `pipeline_runs` status to "running"
  - Uses Lovable AI to generate realistic, contextual analysis results and narratives for the requested module
  - Updates `pipeline_runs` to "complete" with results stored in `analysis_results`
- Update `ModulePanel.tsx`:
  - Wire "Run Analysis" button with onClick handler
  - Show loading spinner and progress animation while analysis runs
  - On completion, refresh results from database
  - Wire "Export" button to download current module results as CSV
- Update `OverviewPanel.tsx`:
  - Fetch pipeline statuses from `pipeline_runs` table
  - Fetch aggregate metrics from `analysis_results` (counts, latest runs)
  - Progress bars reflect real database state
- Update `StatusBar.tsx`:
  - Query active pipeline runs to show real "PIPELINE ACTIVE/IDLE" status
  - Show actual count of loaded datasets from `cohorts` table
  - Replace static GPU/latency with timestamps of last analysis run

## Phase 4: Stable Charts + Persistent Data

- Fix `SurvivalCurveChart.tsx` and `ClonalDynamicsChart.tsx`:
  - Replace `Math.random()` with seeded pseudo-random function so data is deterministic
  - Accept optional `data` prop to render results from database when available
- Update chart components to accept data from analysis results when they exist, falling back to default seeded data
- Wire cohort loading in chat to actually store cohort in `cohorts` table and update UI state from database

## Phase 5: State Management + Data Flow

- Create a shared state layer using React context (`TempestContext`):
  - `pipelineStates`: real-time pipeline status per module
  - `cohort`: currently loaded cohort
  - `analysisResults`: cached results per module
- Create custom hooks:
  - `usePipelineStatus()` - fetches and subscribes to pipeline_runs
  - `useAnalysisResults(module)` - fetches results for a module
  - `useChatMessages()` - loads/saves chat history
- All components read from context rather than hardcoded constants

## Technical Details

### Database Schema (Migration)

```text
pipeline_runs
  id: uuid PK
  module: text (motf, gbsc, bctn, cnis, msrs)
  status: text (idle, running, complete, failed)
  progress: integer (0-100)
  started_at: timestamptz
  completed_at: timestamptz
  created_at: timestamptz

analysis_results
  id: uuid PK
  module: text
  results: jsonb
  config: jsonb
  created_at: timestamptz

chat_messages
  id: uuid PK
  role: text (user, assistant)
  content: text
  tools: jsonb
  action: jsonb
  created_at: timestamptz

cohorts
  id: uuid PK
  name: text
  samples: integer
  timepoints: jsonb
  modalities: jsonb
  tensor_shape: text
  latent_factors: integer
  variance_explained: text
  created_at: timestamptz
```

### Files to Create
- `supabase/functions/chat/index.ts` - AI chat edge function
- `supabase/functions/run-analysis/index.ts` - Pipeline execution edge function
- `src/contexts/TempestContext.tsx` - Shared state context
- `src/hooks/usePipelineStatus.ts` - Pipeline status hook
- `src/hooks/useAnalysisResults.ts` - Analysis results hook
- `src/hooks/useChatMessages.ts` - Chat persistence hook
- `src/lib/seededRandom.ts` - Deterministic chart data generator

### Files to Modify
- `src/components/tempest/ChatPanel.tsx` - Real AI streaming
- `src/components/tempest/ModulePanel.tsx` - Run Analysis + Export buttons
- `src/components/tempest/OverviewPanel.tsx` - Live metrics from DB
- `src/components/tempest/StatusBar.tsx` - Real status from DB
- `src/components/tempest/charts/SurvivalCurveChart.tsx` - Stable data
- `src/components/tempest/charts/ClonalDynamicsChart.tsx` - Stable data
- `src/pages/Index.tsx` - Wrap in TempestContext provider

### Edge Function Config
```toml
[functions.chat]
verify_jwt = false

[functions.run-analysis]
verify_jwt = false
```

## Implementation Order

1. Enable Lovable Cloud
2. Create database migration (all tables)
3. Seed default pipeline states
4. Create edge functions (chat + run-analysis)
5. Build TempestContext and hooks
6. Update ChatPanel with real AI streaming
7. Wire ModulePanel buttons
8. Update OverviewPanel and StatusBar with live data
9. Fix chart stability
10. End-to-end testing


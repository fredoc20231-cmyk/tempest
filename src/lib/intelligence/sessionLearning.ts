/**
 * Persistent adaptive analysis memory.
 *
 * NOT model training. This is a per-browser scratchpad that lets the
 * wizard, knowledge base, and Ask-TEMPEST panel remember the user's column
 * mappings, overrides, module results, and warnings.
 *
 * Backed by localStorage so it persists across tab close, browser restart,
 * and navigation. Only cleared when the user explicitly resets. Pure
 * functions (no React state) — call from any component.
 */
import type { DatasetContext, DetectedColumns } from "./dataIntelligenceEngine";

const KEY = "tempest.session.adaptive_memory.v1";

export interface UploadedDatasetSummary {
  name: string;
  rows: number;
  columns: string[];
  uploaded_at: string;
  source?: string;
}

export interface ModuleResultRecord {
  module: string;
  recorded_at: string;
  summary: Record<string, unknown>;
}

export interface WarningRecord {
  module: string;
  message: string;
  shown_at: string;
}

export interface SessionContext {
  dataset?: UploadedDatasetSummary;
  context?: DatasetContext;
  column_mapping?: DetectedColumns;
  user_overrides: Record<string, string | null>;
  module_results: ModuleResultRecord[];
  warnings_shown: WarningRecord[];
}

const EMPTY: SessionContext = {
  user_overrides: {},
  module_results: [],
  warnings_shown: [],
};

function load(): SessionContext {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as SessionContext) };
  } catch {
    return { ...EMPTY };
  }
}

function save(ctx: SessionContext): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    /* quota / private mode — silently degrade */
  }
}

export function getSessionContext(): SessionContext {
  return load();
}

export function resetSessionContext(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function rememberUploadedDatasetSummary(summary: UploadedDatasetSummary): void {
  const s = load();
  s.dataset = summary;
  save(s);
}

export function rememberColumnMapping(mapping: DetectedColumns, context?: DatasetContext): void {
  const s = load();
  s.column_mapping = mapping;
  if (context) s.context = context;
  save(s);
}

export function rememberUserOverride(field: string, value: string | null): void {
  const s = load();
  s.user_overrides[field] = value;
  save(s);
}

export function rememberModuleResult(module: string, summary: Record<string, unknown>): void {
  const s = load();
  s.module_results = [
    ...s.module_results.filter((r) => r.module !== module),
    { module, recorded_at: new Date().toISOString(), summary },
  ];
  save(s);
}

export function rememberWarningShown(module: string, message: string): void {
  const s = load();
  s.warnings_shown.push({ module, message, shown_at: new Date().toISOString() });
  save(s);
}

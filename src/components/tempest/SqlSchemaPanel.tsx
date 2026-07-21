import { Database, Shield, Key } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Column = { name: string; type: string; nullable?: boolean; default?: string; note?: string };
type Table = {
  name: string;
  purpose: string;
  columns: Column[];
  rls: string[];
};

const tables: Table[] = [
  {
    name: "datasets",
    purpose:
      "Registry of ingested cohorts/datasets — both user uploads and public sources (cBioPortal, GEO, TCGA). Payload lives in `data` JSONB; `is_training` marks reference cohorts used to ground the AI Agent.",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true, note: "Owner (auth.users.id)" },
      { name: "name", type: "text" },
      { name: "source", type: "text", note: "upload | cbioportal | geo | tcga | …" },
      { name: "source_id", type: "text", nullable: true },
      { name: "category", type: "text", default: "'genomic'" },
      { name: "description", type: "text", nullable: true },
      { name: "data", type: "jsonb", default: "'{}'" },
      { name: "metadata", type: "jsonb", default: "'{}'" },
      { name: "record_count", type: "integer", default: "0" },
      { name: "is_training", type: "boolean", default: "false" },
      { name: "created_at", type: "timestamptz", default: "now()" },
      { name: "updated_at", type: "timestamptz", default: "now()" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
  {
    name: "cohorts",
    purpose:
      "MOTF-ready cohort descriptors — sample counts, timepoints, modalities, and Tucker decomposition summary (tensor shape, latent factors, variance explained).",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "name", type: "text" },
      { name: "samples", type: "integer", default: "0" },
      { name: "timepoints", type: "jsonb", nullable: true },
      { name: "modalities", type: "jsonb", nullable: true },
      { name: "tensor_shape", type: "text", nullable: true },
      { name: "latent_factors", type: "integer", nullable: true },
      { name: "variance_explained", type: "text", nullable: true },
      { name: "created_at", type: "timestamptz", default: "now()" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
  {
    name: "pipeline_runs",
    purpose:
      "Live execution state for each analysis module (MOTF, GBSC, BCTN, CNIS, MSRS, Trajectory, TTI). Powers the status bar and Retry/Reset controls.",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "module", type: "text" },
      { name: "status", type: "text", default: "'idle'", note: "idle | running | done | error" },
      { name: "progress", type: "integer", default: "0" },
      { name: "started_at", type: "timestamptz", nullable: true },
      { name: "completed_at", type: "timestamptz", nullable: true },
      { name: "created_at", type: "timestamptz", default: "now()" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
  {
    name: "analysis_results",
    purpose:
      "Persisted output of each module run — full result JSON plus the config that produced it. Consumed by ReportPanel, OverviewPanel, and export utilities.",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "module", type: "text" },
      { name: "results", type: "jsonb", default: "'{}'" },
      { name: "config", type: "jsonb", default: "'{}'" },
      { name: "created_at", type: "timestamptz", default: "now()" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
  {
    name: "sealed_predictions",
    purpose:
      "Walk-forward / prospective forecast records used by the Validation Harness — sealed at t₀ so the outcome cannot leak back into training.",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", note: "Required (not null)" },
      { name: "…", type: "jsonb", note: "prediction, sealed_at, resolved_at, outcome, metrics" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
  {
    name: "chat_messages",
    purpose:
      "AI Agent conversation history (user + assistant). `tools` records grounded tool calls; `action` records UI actions the agent proposed.",
    columns: [
      { name: "id", type: "uuid", default: "gen_random_uuid()" },
      { name: "user_id", type: "uuid", nullable: true },
      { name: "role", type: "text", note: "user | assistant | system" },
      { name: "content", type: "text" },
      { name: "tools", type: "jsonb", nullable: true },
      { name: "action", type: "jsonb", nullable: true },
      { name: "created_at", type: "timestamptz", default: "now()" },
    ],
    rls: ["Owner-only read/write (user_id = auth.uid())"],
  },
];

const storage = [
  {
    bucket: "cohort-uploads",
    purpose: "Raw CSV/TSV cohort uploads. Private bucket; objects are read only by their owner.",
  },
];

const edgeFunctions = [
  { name: "run-analysis", purpose: "Executes MOTF/GBSC/BCTN/CNIS/MSRS/Trajectory pipelines and writes to analysis_results + pipeline_runs." },
  { name: "interpret-tti", purpose: "Gemini-grounded interpretation of fTTI (VR-PH primary) scores." },
  { name: "synthesize-prediction", purpose: "Produces sealed prospective predictions for the Validation Harness." },
  { name: "fetch-public-data", purpose: "Pulls cohorts from cBioPortal / GEO / Ensembl into the datasets table." },
  { name: "chat", purpose: "AI Agent backend — Gemini 2.5 Flash, grounded on user datasets and results." },
  { name: "auto-learn", purpose: "Flags reference datasets (is_training=true) for AI context enrichment." },
];

const SqlSchemaPanel = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Project Schema</h1>
          <p className="text-sm text-muted-foreground">
            TEMPEST backend — tables, storage, and edge functions that power the platform.
          </p>
        </div>
      </div>

      <Card className="p-4 flex items-start gap-3 border-primary/30 bg-primary/5">
        <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          Every table has Row-Level Security enabled with owner-scoped policies (<code>user_id = auth.uid()</code>).
          Anonymous access is disabled; all reads and writes require an authenticated session.
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tables</h2>
        {tables.map((t) => (
          <Card key={t.name} className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                <code className="font-mono text-sm font-semibold">public.{t.name}</code>
              </div>
              <div className="flex gap-1 flex-wrap">
                {t.rls.map((r) => (
                  <Badge key={r} variant="outline" className="text-[10px] font-mono">
                    RLS · {r}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t.purpose}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border border-border rounded">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2">Column</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Default</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {t.columns.map((c, i) => (
                    <tr key={c.name} className={i % 2 ? "bg-muted/20" : ""}>
                      <td className="p-2">{c.name}</td>
                      <td className="p-2 text-primary">{c.type}{c.nullable ? "?" : ""}</td>
                      <td className="p-2 text-muted-foreground">{c.default || "—"}</td>
                      <td className="p-2 text-muted-foreground">{c.note || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Storage Buckets</h2>
        {storage.map((s) => (
          <Card key={s.bucket} className="p-4">
            <code className="font-mono text-sm font-semibold">{s.bucket}</code>
            <p className="text-sm text-muted-foreground mt-1">{s.purpose}</p>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Edge Functions</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {edgeFunctions.map((f) => (
            <Card key={f.name} className="p-4">
              <code className="font-mono text-sm font-semibold text-primary">{f.name}</code>
              <p className="text-xs text-muted-foreground mt-1">{f.purpose}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default SqlSchemaPanel;

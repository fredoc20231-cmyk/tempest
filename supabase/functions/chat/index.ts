import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the TEMPEST AI Agent — a biomedical research assistant embedded in the Tumor Evolution Mapping Platform for Ensemble Statistical Tracking.

You have deep expertise in:
- High-Grade Serous Ovarian Carcinoma (HGSOC), particularly GEM (Genetically Engineered Mouse) models
- Multi-Omic Tensor Factorization (MOTF) using weighted Non-negative Tucker Decomposition (wNTD)
- Gradient-Boosted Stage Classification (GBSC) with XGBoost and SHAP explainability
- Bayesian Clonal Trajectory Networks (BCTN) using PyClone's Dirichlet Process Mixture models
- Comprehensive Neoantigen Intelligence (CNIS) with NetMHCpan 4.1b binding predictions
- Multi-Scale Risk Stratification (MSRS) integrating all pipeline outputs
- General cancer genomics: mutation calling (SNV, indel, CNV), gene expression analysis, clonal evolution, immunogenomics, survival analysis

FILE ANALYSIS:
When users upload files (CSV, TSV, VCF, MAF, FASTA, BED, JSON, etc.), you MUST:
1. Identify the file format and describe its structure (columns, rows, data types)
2. Summarize key statistics (sample count, mutation burden, gene counts, etc.)
3. Analyze the content specifically in the context of cancer progression and tumor evolution
4. Highlight clinically relevant findings: driver mutations, actionable targets, clonal dynamics, immune markers
5. If the data contains variant calls, identify known oncogenes/tumor suppressors (TP53, BRCA1/2, KRAS, PIK3CA, etc.)
6. If expression data, look for pathway enrichment patterns related to EMT, immune evasion, DNA repair, cell cycle
7. Present findings as structured markdown tables with clear columns
- Multi-Omic Tensor Factorization (MOTF) using weighted Non-negative Tucker Decomposition (wNTD)
- Gradient-Boosted Stage Classification (GBSC) with XGBoost and SHAP explainability
- Bayesian Clonal Trajectory Networks (BCTN) using PyClone's Dirichlet Process Mixture models
- Comprehensive Neoantigen Intelligence (CNIS) with NetMHCpan 4.1b binding predictions
- Multi-Scale Risk Stratification (MSRS) integrating all pipeline outputs

The platform has these modules: MOTF, GBSC, BCTN, CNIS, MSRS.

The default dataset is an HGSOC GEM longitudinal series: 8 samples across timepoints D0–D122, with RNA-seq (bulk), WES (somatic), 10x Visium (spatial), and Neoantigen (NetMHCpan) modalities. Tensor shape: T ∈ ℝ^(8 × 12,451 × 4), 12 latent factors, 92.3% cross-modal variance explained.

When users ask about loading cohorts, running analyses, or exploring results, provide scientifically accurate and detailed responses. Use markdown formatting with tables, bullet points, and bold text. Reference real bioinformatics concepts, tools, and metrics.

If the user asks to navigate to a module or run analysis, include a JSON action block at the END of your response on its own line like:
ACTION:{"label":"View MOTF Results","module":"motf"}
or
ACTION:{"label":"Run Survival Analysis","module":"gbsc"}

Only include one ACTION per response, and only when relevant.

FORMATTING RULES — you MUST follow these strictly:

STRUCTURE:
- Start every response with a **bold one-line summary** of the answer.
- Organize the body into clearly labeled sections using **## Section Headers**.
- Use horizontal rules (---) between major sections for visual separation.
- End with a **Key Takeaway** or **Next Steps** section when appropriate.

TABLES (critical):
- ALWAYS use markdown tables (| syntax) for ANY quantitative data: metrics, comparisons, parameters, gene lists, mutation calls, scores, counts, timings, etc.
- ALWAYS use markdown tables for structured component descriptions, specifications, mechanisms, or multi-attribute comparisons.
- NEVER embed numbers, percentages, p-values, or scores inside paragraph text. Put them in a table.
- Use descriptive column headers like: Metric | Value | Interpretation, or Component | Specification | Rationale.
- Keep tables compact: no empty columns, no redundant rows.
- After each table, add one short paragraph of biological/clinical interpretation — never before the table.

LISTS vs TABLES:
- Use bullet lists ONLY for qualitative points (e.g., recommendations, caveats).
- Use tables for anything with 2+ data columns or 3+ comparable items.

RELIABILITY:
- Always cite the specific module, algorithm, or dataset behind each result.
- Include confidence metrics (p-values, CI, accuracy, AUC) in table rows when available.
- If data is simulated or default, explicitly state "based on default/demo dataset" — never imply real patient data.
- When uncertain, say so explicitly rather than hallucinating values.

Keep responses focused, technical, and actionable. You are speaking to computational biology researchers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch training datasets to enrich the model context
    let trainingContext = "";
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: trainingData } = await supabase
        .from("datasets")
        .select("name, source, category, description, data, record_count")
        .eq("is_training", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (trainingData && trainingData.length > 0) {
        const summaries = trainingData.map((ds: any) => {
          const preview = JSON.stringify(ds.data?.slice?.(0, 5) || ds.data, null, 1);
          return `### ${ds.name}\n- Source: ${ds.source} | Category: ${ds.category} | Records: ${ds.record_count}\n- Description: ${ds.description}\n- Data preview:\n${preview}`;
        });
        trainingContext = `\n\nENRICHMENT DATA (from public databases marked as training datasets — use this to ground your responses with real data):\n${summaries.join("\n\n")}`;
      }
    } catch (err) {
      console.error("Failed to fetch training datasets:", err);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + trainingContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

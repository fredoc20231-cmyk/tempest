import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

FORMATTING RULES — you MUST follow these:
- When presenting metrics, comparisons, parameters, or quantitative results, ALWAYS use a markdown table with | syntax. Use columns like: Metric | Value | Interpretation (or similar).
- Do NOT mix numeric results into running paragraph text. Separate the table from narrative interpretation.
- After the table, include a short paragraph with the biological or clinical interpretation.
- For lists of genes, neoantigens, or features, use a table with columns like: Rank | Gene/Feature | Score | Notes.
- Keep narrative text concise and outside of tables.

Keep responses focused, technical, and actionable. You are speaking to computational biology researchers.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

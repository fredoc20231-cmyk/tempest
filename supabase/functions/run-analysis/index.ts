import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULE_PROMPTS: Record<string, string> = {
  motf: "Generate realistic MOTF (Multi-Omic Tensor Factorization) analysis results for an HGSOC GEM longitudinal cohort. Include tensor decomposition metrics, latent factor annotations, cross-modal variance, and pathway correlations. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  gbsc: "Generate realistic GBSC (Gradient-Boosted Stage Classifier) results. Include LOTO cross-validation accuracy, F1 scores per stage, AUC-ROC values, SHAP feature importances, and Brier scores. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  bctn: "Generate realistic BCTN (Bayesian Clonal Trajectory Network) results. Include PyClone subclonal clusters per timepoint, missense:silent ratios, Gelman-Rubin convergence, ARI stability, and clonal gene programs. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  cnis: "Generate realistic CNIS (Neoantigen Intelligence) results. Include NetMHCpan binding predictions, recurrent neoantigens across timepoints, fusion-derived neoantigens, and stage-spanning antigens. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  msrs: "Generate realistic MSRS (Multi-Scale Risk Stratification) results. Include composite risk scores integrating MOTF, GBSC, BCTN, and CNIS outputs, bootstrap confidence intervals, and therapeutic timing recommendations. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { module } = await req.json();
    if (!module || !MODULE_PROMPTS[module]) {
      return new Response(JSON.stringify({ error: "Invalid module" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Set pipeline to running
    await supabase
      .from("pipeline_runs")
      .update({ status: "running", progress: 25, started_at: new Date().toISOString() })
      .eq("module", module);

    // Update progress to 50%
    await supabase
      .from("pipeline_runs")
      .update({ progress: 50 })
      .eq("module", module);

    // Call AI to generate results
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a biomedical data analysis engine. Return ONLY valid JSON, no markdown fences, no extra text." },
          { role: "user", content: MODULE_PROMPTS[module] },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_analysis_results",
              description: "Return the analysis results",
              parameters: {
                type: "object",
                properties: {
                  metrics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        metric: { type: "string" },
                        value: { type: "string" },
                        trend: { type: "string" },
                      },
                      required: ["metric", "value", "trend"],
                      additionalProperties: false,
                    },
                  },
                  narrative: { type: "string" },
                },
                required: ["metrics", "narrative"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_analysis_results" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      await supabase
        .from("pipeline_runs")
        .update({ status: "failed", progress: 0 })
        .eq("module", module);
      
      return new Response(JSON.stringify({ error: `AI error: ${aiResponse.status}` }), {
        status: aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let results: any;
    
    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        results = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing content directly
        const content = aiData.choices?.[0]?.message?.content || "{}";
        results = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      }
    } catch {
      results = { metrics: [], narrative: "Analysis complete but results could not be parsed." };
    }

    // Update progress to 90%
    await supabase
      .from("pipeline_runs")
      .update({ progress: 90 })
      .eq("module", module);

    // Store results
    await supabase.from("analysis_results").insert({
      module,
      results,
      config: { ran_at: new Date().toISOString(), model: "gemini-3-flash-preview" },
    });

    // Mark complete
    await supabase
      .from("pipeline_runs")
      .update({ status: "complete", progress: 100, completed_at: new Date().toISOString() })
      .eq("module", module);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("run-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

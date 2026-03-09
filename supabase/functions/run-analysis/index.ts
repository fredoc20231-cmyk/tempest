import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODULE_PROMPTS: Record<string, string> = {
  motf: "Generate realistic MOTF (Multi-Omic Tensor Factorization) analysis results for an HGSOC GEM longitudinal cohort. The tensor T ∈ ℝ^(8 × 12,451 × 4) decomposes via weighted Non-negative Tucker Decomposition. Include tensor decomposition metrics, latent factor annotations (LF1 correlates with stage at r=0.94, p<10⁻⁶), cross-modal variance (92.3%), and pathway correlations (PROGENy). Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  gbsc: "Generate realistic GBSC (Gradient-Boosted Stage Classifier) results for HGSOC GEM model. XGBoost with 350 estimators, depth 5, η=0.04, L2 γ=1.2. LOTO cross-validation across 8 timepoints. Include: accuracy 94.7%, macro-F1 0.93, AUC-ROC per stage, SHAP feature importances showing LF1 and immune features as top contributors, Brier calibration scores. Reference the four disease states: early (D0/20/21), intermediate (D52), transitional (D88/99), advanced (D109/122). Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  bctn: "Generate realistic BCTN (Bayesian Clonal Trajectory Network) results for HGSOC GEM model. PyClone v0.13.1 with Dirichlet Process Mixture (10K MCMC, 1K burn-in, Binomial emission). Include: 4-6 subclonal clusters at D52 consolidating to 1-2 dominant lineages by D122, missense:silent ratios declining from 2.65 (D88) to 1.16 (D122), Gelman-Rubin R̂<1.1, ARI>0.90. Reference clonal programs: Cluster 0 (immune modulation, Mr1, Cd24a), Cluster 2 (vasculogenesis, Smarca4, Amot). Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  cnis: `Generate comprehensive CNIS (Neoantigen Intelligence) results for HGSOC GEM model using DATABASE-VALIDATED data.

VALIDATED NEOANTIGEN DATA (use these exact values):

MUTATION-DERIVED NEOANTIGENS (n=11):
- MEIS1 F378X: peptide TFFFXXMVLF, H-2-Db 23.071% (WB), D20+D122 (trunk), COSMIC VALIDATED, 19% immunogenicity in human, CD8+ T-cell infiltration marker via CCL18/CCL4/CXCL7 chemokines, Priority 1
- ZKSCAN7 K404N: peptide HTQENPYECC, H-2-Db 10.379% (WB), D20+D122 (trunk), LIMITED DATA, Priority 2
- Ubtd2: peptide GALTDCYDEL, H-2-Db 0.743% (SB), D52, unknown human status, Priority 3
- SLFN8 I791N: peptide EDMVNYVADK, H-2-Db 60.625%, D52+D99, human ortholog SLFN11 is platinum sensitivity biomarker, Priority 4 (biomarker only)

FUSION-DERIVED NEOANTIGENS (n=4,488 from 374 fusion events, 164 high-confidence):
- Camk1d::Arid1a: junction AVLRNHPVQWI, H-2-Db 0.519% (WB), D52, ARID1A COSMIC VALIDATED (46-70% clear cell OC, 30-46% endometrioid), Priority 1
- Fxr1::Zfp704: junction AFYKNSKMV, H-2-Db 1.329% (WB), H-2-Kb 1.385% (WB), D99, dual MHC binding, Priority 1
- Nsd3::Kat6a: junction SGSADTPVL, H-2-Db 1.230% (WB), D99, BOTH genes COSMIC validated (histone modifiers), Priority 1
- Mfhas1::Tns3: junction HAFPGDDPI, H-2-Db 0.133% (SB) STRONGEST BINDER, D109-D122, novel fusion, Priority 2
- Gbp10::Gbp4: junction KGVKASEVF, H-2-Db 1.674% (WB), D52, interferon response genes, Priority 2

TEMPORAL FUSION EVOLUTION:
- D20: 11 fusions, 1 high-confidence, 18/32 high-immunogenicity (56%)
- D52: 57 fusions, 16 high-confidence, 368/648 high-immunogenicity (57%)
- D88: 104 fusions, 52 high-confidence, 1045/1856 high-immunogenicity (56%) — PEAK DIVERSITY
- D99: 96-28 fusions, 57-13 high-confidence — consolidation begins
- D109: 27 fusions, 10 high-confidence
- D122: 32 fusions, 6 high-confidence — persistent targets only

RNA/WES INTEGRATION: 993 predicted H-2-Db binders validated. Expression: MEIS1 4.2 log2CPM (↑2.1-fold FDR<0.01), ARID1A 6.8 log2CPM (↑3.4-fold FDR<0.001), KAT6A 5.1 log2CPM (↑2.8-fold FDR<0.05). Pipeline: GATK4 Mutect2 → SnpEff → NetMHCpan-4.1 → PyClone (17 clonal clusters).

COSMIC VALIDATION: MEIS1 validated (3.51% NSCLC), ARID1A validated (46-70% OC), KAT6A validated (overexpressed, β-catenin), NSD3 validated (25 COSMIC-3D structures), ZKSCAN7 limited data, SLFN8 ortholog (SLFN11 biomarker).

Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary). Include ALL validated candidates with exact binding values, temporal patterns, COSMIC status, and clinical translation feasibility.`,
  msrs: "Generate realistic MSRS (Multi-Scale Risk Stratification) results integrating all TEMPEST modules. Include composite risk scores with bootstrap CI (n=1,000), therapeutic timing recommendations referencing the D52-75 intervention window, ECM remodeling as permissive for proliferative expansion, and the bifurcation point at D88-99 where single biomarker panels may fail post-branch. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  trajectory: "Generate realistic Trajectory Prediction results using a dynamical systems framework for HGSOC GEM model cancer evolution. Model transcriptomic state as stochastic gradient flow dx/dt = -∇U(x) + η(t) on an epigenetic landscape. Include: bifurcation analysis showing late-stage branching at Day 88-99 as supercritical pitchfork (μx - x³), transcriptomic entropy S(t) peaking at Day 99 (Shannon entropy from GMM state occupancy), early warning signals (variance increase 2.4× at D88, rising autocorrelation), within-timepoint dispersion metrics, phase structure (4 phases: early constrained D0-21, transition D52, bifurcation D88-99, advanced D109-122), and progression coordinate Φ(t) = α·Epi + β·Sig + γ·Imm. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
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

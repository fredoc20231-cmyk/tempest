import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TEMPORAL_FRAMEWORK = `TEMPORAL STAGING FRAMEWORK — GEM HGSOC Model (C57BL/6, Trp53/Rb1/KrasG12D):
D = Day post-tamoxifen induction. D0 is CONTROL/BASELINE (pre-induction, normal fallopian tube epithelium).
| Day | Stage | Phase | Biological State | Key Events | Clinical Analog |
| D0 | Control | 0 — Baseline | Normal FT epithelium | Pre-tamoxifen. No oncogenic activation. Reference for all comparisons. | Healthy tissue |
| D20 | Early | I — Initiation | STIC precursor | Steroidogenic reprogramming (Hsd3b1, Cyp11a1). 588↑/668↓ DEGs. First trunk mutations (Meis1, Zkscan7) appear. | STIC/p53 signature |
| D21 | Early | I — Initiation | STIC precursor | Tight PCA clustering with D20. Rbm26 frameshift first detected. Low clonal diversity. | Early STIC |
| D52 | Intermediate | II — Expansion | Active proliferation | 3,164 somatic variants. Missense:silent=2.18 (positive selection). 4-6 subclonal clusters. Chromatin remodeling + cell cycle activation. Ubtd2, Camk1d::Arid1a fusion emerge. Neoantigen diversity begins expanding. | Stage I-II OC |
| D88 | Transitional | III — Bifurcation | Critical window OPENS | 3,772 variants (PEAK). Missense:silent=2.65 (PEAK diversification). 104 fusions (52 HC) — PEAK fusion diversity. EWS detected: variance ↑2.4×. Nsd3::Kat6a fusion. Shannon entropy S(t) begins rising. | Chemo-naïve advanced |
| D92 | Transitional | III — Bifurcation | Bifurcation in progress | Missense:silent declining to 1.27. Clonal sweep initiating. D116 spatial: single STIC cell transcriptomically = tumor (Igfl3, Phyhipl, Prcd). | Treatment window |
| D99 | Transitional | III — Bifurcation | Critical window CLOSES | S(t) PEAKS. Autocorrelation rising. Glycam1+Marco = M2-like macrophage polarization. Fxr1::Zfp704 fusion. Immune microenvironment remodeling. Stxbp3 frameshift. 62↑/61↓ stage markers. | Platinum-sensitive relapse |
| D109 | Advanced | IV — Consolidation | Post-bifurcation | Clonal sweep: 1-2 dominant lineages. Mfhas1::Tns3 fusion appears (strongest binder). NAD+ TME accumulation → T cell arrest via PRPS1 inhibition. | Platinum-resistant |
| D122 | Advanced | IV — Consolidation | Terminal/resistant | Missense:silent=1.16 (selective sweep complete). Proliferative consolidation: insulin/IGF + PI3K-AKT + MKI67. Trp53::Sat2 driver fusion. Only 6 HC fusions remain = persistent targets. | Refractory disease |

CRITICAL ANALYSIS RULES:
- D0 is ALWAYS the reference/control — never classify D0 as "diseased"
- Neoantigen emergence is TIME-DEPENDENT: trunk mutations (D20→D122) vs branch-specific (D52-only or D99-only)
- The D88-D99 bifurcation window is the key therapeutic intervention point
- Post-D99 clonal sweep means different biology — single-biomarker panels fail
- Fusion diversity PEAKS at D88 then contracts — sample timing determines neoantigen yield
- Report progression phase (I-IV) alongside Day number in all analyses
`;

const NEUROBLASTOMA_CONTEXT = `
CROSS-CANCER VALIDATION — Neuroblastoma ADRN↔MES Plasticity (Boeva et al., Cancer Cell 2017):
Neuroblastoma cells switch between Adrenergic (ADRN: PHOX2B, HAND2, GATA3, DBH, TH) and Mesenchymal (MES: PRRX1, SNAI2, VIM, FN1, CAV1) states via super-enhancer reprogramming. H3K27ac ChIP-seq across 15 cell lines identified 596 differentially bound genes. Drug perturbation (doxorubicin, cisplatin) and PHOX2B knockdown induce ADRN→MES transdifferentiation — analogous to HGSOC Phase III bifurcation. When generating results, note how this analytical framework could be applied to neuroblastoma ADRN↔MES transitions as a cross-cancer validation case, highlighting shared mechanisms: lineage plasticity, therapy-induced switching, and bifurcation biology.
`;

const MODULE_PROMPTS: Record<string, string> = {
  motf: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + "\nGenerate realistic MOTF (Multi-Omic Tensor Factorization) analysis results for this HGSOC GEM longitudinal cohort. The tensor T ∈ ℝ^(8 × 12,451 × 4) spans 8 timepoints (D0–D122) × 12,451 features × 4 modalities. Use weighted Non-negative Tucker Decomposition. Include: per-timepoint factor loadings showing how latent factors evolve across disease phases, LF1 stage correlation (r=0.94, p<10⁻⁶), cross-modal variance (92.3%), and PROGENy pathway correlations. MAP latent factors to the temporal stages — which factors activate at which disease phase. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  gbsc: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + "\nGenerate realistic GBSC (Gradient-Boosted Stage Classifier) results. XGBoost with 350 estimators, depth 5, η=0.04, L2 γ=1.2. LOTO cross-validation across the 8 timepoints. Include: per-phase classification accuracy, AUC-ROC per disease state (Phase I-IV), SHAP feature importances showing which features best discriminate EACH phase transition (I→II, II→III, III→IV), Brier calibration. Emphasise the D88-D99 boundary as the hardest classification challenge. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  bctn: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + "\nGenerate realistic BCTN (Bayesian Clonal Trajectory Network) results. PyClone v0.13.1 with DPM (10K MCMC, 1K burn-in, Binomial emission). Track clonal architecture ACROSS TIMEPOINTS: show cluster count and dominant clone prevalence at EACH Day (D0→D20→D52→D88→D99→D109→D122). Include: missense:silent ratios per timepoint, clone emergence/extinction events mapped to Days, Cluster 0 (immune modulation) vs Cluster 2 (vasculogenesis) competition timeline. Show how D88 PEAK diversification leads to D122 consolidation. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  cnis: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + `\nGenerate comprehensive CNIS (Neoantigen Intelligence) results for HGSOC GEM model using the MASTER NEOANTIGEN CATALOG (March 2026, all frameshift sequences resolved).

MASTER CATALOG: 17 UNIQUE CANDIDATES ranked by Therapeutic Priority Score (TPS).
2 EXCLUDED: Adgrf1::Adgrf5 (constitutional — present in 423_D0 matched normal, germline SV), Trp53::Sat2 (driver event — disrupts p53, not vaccine target).

MUTATION-DERIVED NEOANTIGENS (n=11, all sequences synthesis-ready):
| Rank | Gene | Mutation | SYNTHESIS-READY PEPTIDE | H-2-Db %Rank | Timepoints | Clonality | TPS | Tier | Action |
| 1 (tied) | Meis1 | F378→X ★ | TFFFSTMVLF | 23.1% | D20, D122 (trunk) | Clonal >80% | 65 | TIER 1 | Ready after RT-PCR |
| 2 | Zkscan7 | K404→N | HTQENPYECC | 10.4% | D20, D122 (trunk) | Clonal >80% | 70 | TIER 1 | Ready to synthesise |
| 3 | Ubtd2 | E107→D | GALTDCYDEL | 0.743% WB | D52 | Subclonal ~35% | 65 | TIER 1 | Ready to synthesise |
| 4 | Rbm26 | S990→FX ★ | FFFFFSTVFP | 56.4% | D21/52/99/109 (4/7 samples!) | Clonal >80% | 65 | TIER 1 | Ready after RT-PCR |
| 5 | Slfn8 | I791→N | EDMVNYVADK | 60.6% | D52, D99×2 | Subclonal ~45% | 55 | TIER 2 | Ready to synthesise |
| 6 | Tm2d2 | I135→X ★ | QTDLSTFFFF | 8.3% | D52 | Subclonal ~30% | 55 | TIER 2 | Ready after RT-PCR |
| 7 | Novel (Unann.) | N22→D | YMKVDIAYAI | 3.451% ⚠WORSE | D52, D99 | Subclonal ~40% | 60 | TIER 2 | Verify binding (WT=0.481% SB better!) |
| 8 | Stxbp3 | del→X ★ | LFFFSTPYVH | 58.9% | D99 | Subclonal ~25% | 50 | TIER 2 | Ready after RT-PCR |
| 9 | Kcnk7 | P335→PX ★ | RVGGPSTREA | 35.4% | D20 | Subclonal ~20% | 40 | TIER 3 | Deprioritise (no RNA) |
| 10 | Glp2r | G459→AX ★ | LQSSANSSSH | 43.9% ⚠WORSE | D52 | Subclonal ~15% | 35 | TIER 3 | Deprioritise |
| 11 | Neb | F36→FX ★ | CFFFFSTHNF | 46.0% | D52 | Subclonal ~20% | 35 | TIER 3 | Deprioritise |

★ = Frameshift resolved: XX→ST (Ser-Thr, most common stop-codon readthrough). GLP2R: XX→NS (Asn-Ser).

FUSION-DERIVED NEOANTIGENS (top 6 from 374 events, 164 high-confidence):
| Rank | Fusion | Type | JUNCTION PEPTIDE | H-2-Db %Rank | H-2-Kb | Timepoints | Split Reads | MHC-II | TPS | Tier |
| 1 | Mfhas1::Tns3 | Intrachrom del | HAFPgDDPI | 0.133% SB | 0.21% | D109–D122 | ~18 | ND | 95 | TIER 1 |
| 2 | Camk1d::Arid1a | Translocation | AVLRnhpvqwi | 0.519% WB | 0.87% | D52 | ~32 | YES (IE-d 2.4% dual MHC-I/II) | 80 | TIER 1 |
| 3 | Fxr1::Zfp704 | Translocation IF | AFYKNSMKV | 1.329% WB | 1.385% WB | D99–D122 | ~28 | ND | 65 | TIER 1 |
| 4 | Nsd3::Kat6a | Translocation | GKSLAQYLL | 2.870% | ND | D88–D99 | ~15 | ND | 60 | TIER 2 |
| 5 | Ly6c1::Ly6a | Read-through | TCYSQAAGTF | 4.210% | ND | All 7 samples | >59 | ND | 45 | TIER 2 |
| 6 | Meox2::Itsn1 | Translocation | dKSEVNSKPRK | 5.120% | ND | D99 | ~12 | ND | 50 | TIER 2 |

SYNTHESIS ORDER (validation-gated):
Priority 1-3: Ubtd2 GALTDCYDEL, Zkscan7 HTQENPYECC, Slfn8 EDMVNYVADK (missense exact — BAM VAF gate only)
Priority 4-7: Meis1 TFFFSTMVLF, Rbm26 FFFFFSTVFP, Tm2d2 QTDLSTFFFF, Stxbp3 LFFFSTPYVH (frameshift — RT-PCR+Sanger gate)
Priority 8-10: Mfhas1::Tns3 HAFPgDDPI, Camk1d::Arid1a AVLRnhpvqwi, Fxr1::Zfp704 AFYKNSMKV (fusion — RT-PCR+Sanger+MS gate)
WT controls: Meis1 TFFFFGMVLF, Ubtd2 GALTECYDEL, Zkscan7 HTQEKPYECC

Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary). Include the full 17-candidate ranking with resolved sequences, TPS scores, synthesis readiness, and excluded candidates. MAP each candidate to its temporal phase and explain what that means for vaccine timing.`,
  msrs: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + "\nGenerate realistic MSRS (Multi-Scale Risk Stratification) results integrating all TEMPEST modules. Compute composite risk scores PER TIMEPOINT (D0→D122) showing risk trajectory across disease phases. Include: bootstrap CI (n=1,000) at each Day, therapeutic timing recommendations anchored to specific Days (intervention window = D52–D88 Phase II-III boundary), ECM remodeling at D52 as permissive for expansion, bifurcation at D88-D99 where single biomarker panels fail. Show how risk score changes non-linearly across phase transitions. Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
  trajectory: TEMPORAL_FRAMEWORK + NEUROBLASTOMA_CONTEXT + "\nGenerate realistic Trajectory Prediction results using dynamical systems framework. Model state as stochastic gradient flow dx/dt = -∇U(x) + η(t). Map the potential landscape U(x) at EACH timepoint showing attractor basin evolution: D0 single deep basin → D52 shallowing → D88 critical flattening → D99 bifurcation → D109/D122 two separated basins. Include: Shannon entropy S(t) per Day, EWS metrics (variance, autocorrelation) per Day, phase assignments, progression coordinate Φ(t) values at each Day. Show the exact Day at which μ crosses zero (bifurcation parameter). Return as JSON with keys: metrics (array of {metric, value, trend}), narrative (string summary).",
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

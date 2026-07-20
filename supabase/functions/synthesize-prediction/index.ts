import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { scenario } = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Pull latest results from each module
    const modules = ["motf", "gbsc", "bctn", "cnis", "msrs", "trajectory"];
    const moduleResults: Record<string, any> = {};
    for (const m of modules) {
      const { data } = await supabase
        .from("analysis_results")
        .select("results, created_at")
        .eq("module", m)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) moduleResults[m] = data[0].results;
    }

    // Pull data sources signature
    const { data: dsData } = await supabase
      .from("datasets")
      .select("name, source, category, record_count, is_training, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const learningSummary = (dsData || []).find((d: any) => d.category === "learning");
    const sourceCount = (dsData || []).length;
    const trainingCount = (dsData || []).filter((d: any) => d.is_training).length;

    const LOVABLE_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const summary = `You are TEMPEST's senior oncology AI Agent. Synthesize the analyses below into:
1. A cross-module interpretation (what each module agrees/disagrees about).
2. The CURRENT inferred disease phase (I Initiation / II Expansion / III Bifurcation / IV Consolidation) with confidence %.
3. PREDICTION OF NEXT PHASE OF CANCER EVOLUTION — what is most likely to happen next, on what timescale, with what biological signatures (DEGs, fusions, immune shifts), and what early-warning signals to monitor.
4. Recommended therapeutic window and intervention class.
5. Risk of resistance / immune escape.

DATA STATE: ${sourceCount} datasets in the warehouse, ${trainingCount} flagged for training.
${learningSummary ? `KNOWLEDGE SYNTHESIS:\n${typeof learningSummary === "object" ? JSON.stringify(learningSummary).slice(0, 1500) : ""}` : ""}

${scenario ? `\nUSER SCENARIO: ${scenario}\nAdapt the framework to this case (translate to the target cancer type if non-HGSOC) and produce the prediction for THIS case.` : ""}

MODULE RESULTS (latest):
${modules.map(m => `\n=== ${m.toUpperCase()} ===\n${moduleResults[m] ? JSON.stringify(moduleResults[m]).slice(0, 2500) : "no results yet"}`).join("\n")}

Return your synthesis as Markdown with clear section headers (## Current State, ## Cross-Module Agreement, ## Predicted Next Phase, ## Therapeutic Window, ## Resistance Risk, ## Monitoring Plan). Use tables where useful. Be specific with timepoints, %, and gene symbols.`;

    const aiResp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert computational oncology AI agent. Be specific, quantitative, and evidence-grounded." },
          { role: "user", content: summary },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI synth error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: `AI error: ${aiResp.status}` }), {
        status: aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const interpretation = aiData.choices?.[0]?.message?.content || "No synthesis generated.";

    // Persist as a special 'synthesis' module result so it appears in history
    await supabase.from("analysis_results").insert({
      module: "synthesis",
      results: { narrative: interpretation, scenario: scenario || null, source_count: sourceCount, training_count: trainingCount },
      config: { ran_at: new Date().toISOString(), kind: "cross-module-prediction" },
    });

    return new Response(JSON.stringify({ success: true, interpretation, sourceCount, trainingCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synthesize-prediction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

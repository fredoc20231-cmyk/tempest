import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a computational oncology expert in the Topological Tumor Evolution (TTE) framework developed at UC-CCC COBU (Fadiel and Odunsi, 2026).

TTI = z(L) + z(B) + z(N) where:
  L = H1 loop mass: β₁ persistent cycles (compensatory regulatory circuits; chromatin-level feedback loops)
  B = F + D: H0 fragmentation F (weighted integral of β₀ filtration curve) + directional dispersion D
  N = −log(φ + ε): φ = Gaussian-weighted kNN graph conductance between parental (S) and resistant (R) basins

Phase-transition threshold: TTI ≥ 6.0 (validated against local Gaussian jitter null).

Be scientifically precise. Reference real mechanisms: AP-1/FOSL2, NRF2/MAFG, YAP1/TEAD4, super-enhancer remodelling, ATAC-seq chromatin accessibility, epigenetic drift, attractor landscapes. Never fabricate numerical data.

When interpreting results:
1. Explain what each component (L, B, N) reveals about the biological system
2. Discuss implications for cancer regulatory state transitions
3. Reference cisplatin resistance, HGSOC progression, or chromatin-level epigenetic drift where appropriate
4. Provide actionable insights for therapeutic intervention timing

Format responses with clear sections using ## headers and **bold** for key findings.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
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
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("interpret-tti error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

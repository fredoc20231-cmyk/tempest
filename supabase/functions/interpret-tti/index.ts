import { preflightRejectSecrets, redact } from "../_shared/redact.ts";
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

CROSS-CANCER VALIDATION — Neuroblastoma ADRN↔MES Plasticity (Boeva et al., Cancer Cell 2017):
The platform includes built-in neuroblastoma H3K27ac ChIP-seq reference data across 15 cell lines. Adrenergic (ADRN) markers: ST18, KCNA3, BTBD11, GJD2, ZIM2, GLRA1, GSTM1, HID1, POU4F2, PHOX2B, HAND2, GATA3, DBH, TH. Mesenchymal (MES) markers: CAV1, AIM2, ZIC1, MET, COL5A2, OSR1, MCTP1, MLPH, PRRX1, SNAI2, VIM, FN1, YAP1. ADRN cell lines: CHP212, TR14, SK-N-BE-2-C, LAN1, IMR32, CLB-PE. MES cell lines: SH-EP, GIMEN, SK-N-AS, N206. Drug perturbation (doxorubicin, cisplatin) and PHOX2B knockdown induce ADRN→MES transdifferentiation — analogous to HGSOC Phase III bifurcation. When neuroblastoma data is analysed, interpret TTI components in terms of ADRN↔MES cell state separation rather than parental/resistant, and draw parallels to HGSOC lineage plasticity, therapy-induced switching, and bifurcation biology.

When interpreting results:
1. Explain what each component (L, B, N) reveals about the biological system
2. Discuss implications for cancer regulatory state transitions
3. Reference cisplatin resistance, HGSOC progression, neuroblastoma ADRN↔MES plasticity, or chromatin-level epigenetic drift where appropriate
4. Provide actionable insights for therapeutic intervention timing

Format responses with clear sections using ## headers and **bold** for key findings.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Predefined cancer-relevant queries across all public sources
const LEARNING_QUERIES = [
  // TCGA
  { source: "tcga", category: "projects", query: "", name: "TCGA Cancer Projects Index" },
  { source: "tcga", category: "mutations", query: "TCGA-OV", name: "TCGA-OV Ovarian Mutations" },
  { source: "tcga", category: "mutations", query: "TCGA-BRCA", name: "TCGA-BRCA Breast Mutations" },
  { source: "tcga", category: "genes", query: "TP53,BRCA1,BRCA2,KRAS,PIK3CA,ARID1A,MYC,PTEN,RB1,CDH1", name: "Key Oncogenes/TSGs" },
  { source: "tcga", category: "cases", query: "TCGA-OV", name: "TCGA-OV Clinical Cases" },
  // cBioPortal
  { source: "cbioportal", category: "studies", query: "ovarian", name: "cBioPortal Ovarian Studies" },
  { source: "cbioportal", category: "studies", query: "neuroblastoma", name: "cBioPortal Neuroblastoma Studies" },
  { source: "cbioportal", category: "studies", query: "breast", name: "cBioPortal Breast Cancer Studies" },
  { source: "cbioportal", category: "genes", query: "TP53,BRCA1,BRCA2,KRAS,ARID1A,PHOX2B,MYCN", name: "cBioPortal Gene Profiles" },
  // UniProt
  { source: "uniprot", category: "search", query: "TP53 AND organism_id:9606 AND reviewed:true", name: "UniProt TP53 Human" },
  { source: "uniprot", category: "search", query: "BRCA1 AND organism_id:9606 AND reviewed:true", name: "UniProt BRCA1 Human" },
  { source: "uniprot", category: "search", query: "PHOX2B AND organism_id:9606", name: "UniProt PHOX2B (Neuroblastoma)" },
  { source: "uniprot", category: "search", query: "MEIS1 AND organism_id:9606", name: "UniProt MEIS1 (HGSOC Neoantigen)" },
  { source: "uniprot", category: "search", query: "KAT6A AND organism_id:9606", name: "UniProt KAT6A (Fusion Target)" },
  // Ensembl
  { source: "ensembl", category: "lookup", query: "TP53", name: "Ensembl TP53 Annotation" },
  { source: "ensembl", category: "lookup", query: "BRCA1", name: "Ensembl BRCA1 Annotation" },
  { source: "ensembl", category: "lookup", query: "ARID1A", name: "Ensembl ARID1A Annotation" },
  { source: "ensembl", category: "lookup", query: "PHOX2B", name: "Ensembl PHOX2B Annotation" },
  { source: "ensembl", category: "lookup", query: "MYCN", name: "Ensembl MYCN Annotation" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    // Check which datasets we already have to avoid re-fetching
    const { data: existing } = await supabase
      .from("datasets")
      .select("name")
      .eq("is_training", true);
    const existingNames = new Set((existing || []).map((d: any) => d.name));

    const newQueries = LEARNING_QUERIES.filter(q => !existingNames.has(q.name));
    if (newQueries.length === 0) {
      // Even if no new queries, generate a learning summary from existing data
      const summary = await generateLearningSummary(supabase, GEMINI_API_KEY);
      return new Response(
        JSON.stringify({ success: true, fetched: 0, total_training: existing?.length || 0, summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fetched = 0;
    const errors: string[] = [];

    // Fetch in batches of 3 to avoid rate limits
    for (let i = 0; i < newQueries.length; i += 3) {
      const batch = newQueries.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(async (q) => {
          try {
            const res = await fetch(`${supabaseUrl}/functions/v1/fetch-public-data`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                source: q.source,
                query: q.query,
                category: q.category,
                save: true,
                is_training: true,
                name: q.name,
              }),
            });
            if (!res.ok) throw new Error(`${q.name}: ${res.status}`);
            return await res.json();
          } catch (e) {
            throw new Error(`${q.name}: ${e instanceof Error ? e.message : "unknown"}`);
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") fetched++;
        else errors.push(r.reason?.message || "unknown error");
      }

      // Small delay between batches
      if (i + 3 < newQueries.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // Generate a learning summary from all training data
    const summary = await generateLearningSummary(supabase, GEMINI_API_KEY);

    // Store the learning summary as a special dataset
    await supabase.from("datasets").upsert(
      {
        name: "TEMPEST Learning Summary",
        source: "auto-learn",
        category: "learning",
        description: `Auto-generated knowledge synthesis from ${fetched + (existing?.length || 0)} training datasets. Updated ${new Date().toISOString().slice(0, 16)}.`,
        data: { summary, generated_at: new Date().toISOString(), source_count: fetched + (existing?.length || 0) },
        record_count: 1,
        metadata: { type: "learning_summary", version: new Date().toISOString() },
        is_training: true,
      },
      { onConflict: "name" }
    );

    return new Response(
      JSON.stringify({
        success: true,
        fetched,
        skipped: LEARNING_QUERIES.length - newQueries.length,
        errors: errors.length > 0 ? errors : undefined,
        total_training: fetched + (existing?.length || 0),
        summary: summary.slice(0, 500) + "...",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auto-learn error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateLearningSummary(supabase: any, apiKey: string): Promise<string> {
  // Fetch all training datasets
  const { data: allTraining } = await supabase
    .from("datasets")
    .select("name, source, category, description, data, record_count")
    .eq("is_training", true)
    .neq("category", "learning")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!allTraining || allTraining.length === 0) return "No training data available yet.";

  const dataSnippets = allTraining.map((ds: any) => {
    const preview = JSON.stringify(
      Array.isArray(ds.data) ? ds.data.slice(0, 3) : ds.data,
      null,
      1
    ).slice(0, 800);
    return `### ${ds.name}\nSource: ${ds.source} | Category: ${ds.category} | Records: ${ds.record_count}\n${ds.description || ""}\nData sample:\n${preview}`;
  });

  const prompt = `You are the TEMPEST AI learning engine. Analyze ALL of the following training datasets and produce a KNOWLEDGE SYNTHESIS that will improve your analytical judgment for cancer genomics, tumor evolution, and precision oncology.

For each dataset, extract:
1. Key biological insights (genes, pathways, mutations, clinical correlations)
2. Cross-dataset patterns (genes appearing across multiple sources, pathway convergences)
3. Clinical relevance (drug targets, biomarkers, prognostic indicators)
4. How this data connects to the HGSOC D0-D122 temporal framework and neuroblastoma ADRN/MES plasticity

TRAINING DATASETS:
${dataSnippets.join("\n\n")}

Return a structured knowledge synthesis (not JSON) that captures the most important learnings for future analyses. Focus on actionable biological insights, NOT data format descriptions.`;

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a biomedical knowledge synthesis engine. Produce concise, actionable scientific knowledge from datasets." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    console.error("Learning summary AI error:", res.status);
    return "Learning summary generation failed — will retry on next cycle.";
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No summary generated.";
}
